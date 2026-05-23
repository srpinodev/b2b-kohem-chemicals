<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\Verify2faRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'message' => 'Usuario registrado correctamente.',
            'user' => $result['user'],
            'token' => $result['token'],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->email, $request->password);

        if (! $result) {
            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }

        return response()->json([
            'user' => $result['user'],
            'token' => $result['token'],
            'requires_2fa' => $result['requires_2fa'],
        ]);
    }

    public function verify2fa(Verify2faRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $this->authService->verify2fa($user, $request->otp)) {
            return response()->json(['message' => 'Código OTP inválido.'], 422);
        }

        return response()->json(['message' => '2FA verificado correctamente.', 'verified' => true]);
    }

    public function setup2fa(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        try {
            $data = $this->authService->setup2fa($user);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($data);
    }

    public function enable2fa(Verify2faRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $this->authService->enable2fa($user, $request->otp)) {
            return response()->json(['message' => 'Código OTP inválido. 2FA no activado.'], 422);
        }

        return response()->json(['message' => '2FA activado correctamente.']);
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function me(): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        return response()->json($user->load(['roles', 'company']));
    }
}
