<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class JwtAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            JWTAuth::parseToken()->authenticate();
        } catch (JWTException) {
            return response()->json(['message' => 'Token inválido o expirado.'], 401);
        }

        return $next($request);
    }
}
