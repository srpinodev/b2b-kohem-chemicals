<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class Require2FA
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = JWTAuth::parseToken()->authenticate();

        if ($user->two_factor_enabled) {
            $payload = JWTAuth::parseToken()->getPayload();

            if (! $payload->get('2fa_verified')) {
                return response()->json([
                    'message' => 'Se requiere verificación de 2FA.',
                    'requires_2fa' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
