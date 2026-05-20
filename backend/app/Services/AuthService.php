<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use PragmaRX\Google2FA\Google2FA;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'company_id' => $data['company_id'] ?? null,
        ]);

        $user->assignRole($data['role'] ?? 'cliente');

        $token = JWTAuth::fromUser($user);

        return ['user' => $user->load('roles'), 'token' => $token];
    }

    public function login(string $email, string $password): array|false
    {
        $token = JWTAuth::attempt(['email' => $email, 'password' => $password]);

        if (! $token) {
            return false;
        }

        $user = JWTAuth::user();

        if (! $user->is_active) {
            JWTAuth::setToken($token)->invalidate();

            return false;
        }

        return ['user' => $user->load(['roles', 'company']), 'token' => $token, 'requires_2fa' => $user->two_factor_enabled];
    }

    public function verify2fa(User $user, string $otp): bool
    {
        return $this->google2fa->verifyKey($user->google2fa_secret, $otp);
    }

    public function setup2fa(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey();
        $user->update(['google2fa_secret' => $secret]);

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        return ['secret' => $secret, 'qr_code_url' => $qrCodeUrl];
    }

    public function enable2fa(User $user, string $otp): bool
    {
        if (! $this->verify2fa($user, $otp)) {
            return false;
        }

        $user->update(['two_factor_enabled' => true]);

        return true;
    }

    public function logout(): void
    {
        // tymon/jwt-auth invalidates the token (adds to blacklist in Redis)
        JWTAuth::invalidate(JWTAuth::getToken());
    }

    public function blacklistKey(User $user): string
    {
        return 'jwt_blacklist:'.$user->id;
    }
}
