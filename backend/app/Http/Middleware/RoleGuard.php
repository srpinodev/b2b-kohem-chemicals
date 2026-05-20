<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class RoleGuard
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (! $user->hasAnyRole($roles)) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        return $next($request);
    }
}
