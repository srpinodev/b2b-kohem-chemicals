<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Notifications\PaymentVerificationCodeNotification;
use Illuminate\Support\Facades\Cache;

/**
 * OTP de un solo uso para autorizar el pago de un pedido.
 * El código vive en Redis con TTL corto y se borra al validarse correctamente.
 */
class PaymentVerificationService
{
    public const TTL_MINUTES = 10;
    private const MAX_ATTEMPTS = 5;

    public function issue(Order $order, User $user): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put($this->codeKey($order, $user), $code, now()->addMinutes(self::TTL_MINUTES));
        Cache::forget($this->attemptsKey($order, $user));

        $user->notify(new PaymentVerificationCodeNotification($order, $code, self::TTL_MINUTES));
    }

    /** Devuelve true si el código coincide; consume el OTP al validar OK. */
    public function verify(Order $order, User $user, string $code): bool
    {
        $attemptsKey = $this->attemptsKey($order, $user);
        $attempts    = (int) Cache::get($attemptsKey, 0);
        if ($attempts >= self::MAX_ATTEMPTS) {
            return false;
        }

        $expected = Cache::get($this->codeKey($order, $user));
        if (! $expected || ! hash_equals((string) $expected, $code)) {
            Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(self::TTL_MINUTES));
            return false;
        }

        // OTP de un solo uso: lo eliminamos para evitar replay.
        Cache::forget($this->codeKey($order, $user));
        Cache::forget($attemptsKey);
        return true;
    }

    private function codeKey(Order $order, User $user): string
    {
        return "payment_otp:order:{$order->id}:user:{$user->id}";
    }

    private function attemptsKey(Order $order, User $user): string
    {
        return "payment_otp_attempts:order:{$order->id}:user:{$user->id}";
    }
}
