<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Middleware\JwtAuthenticate;
use App\Http\Middleware\RoleGuard;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    $checks = [
        'status' => 'ok',
        'app' => config('app.name'),
        'env' => config('app.env'),
    ];

    try {
        DB::connection()->getPdo();
        $checks['database'] = 'ok';
    } catch (\Exception $e) {
        $checks['database'] = 'error: '.$e->getMessage();
        $checks['status'] = 'degraded';
    }

    try {
        Cache::store('redis')->put('health_ping', true, 5);
        $checks['redis'] = Cache::store('redis')->get('health_ping') ? 'ok' : 'error';
    } catch (\Exception $e) {
        $checks['redis'] = 'error: '.$e->getMessage();
        $checks['status'] = 'degraded';
    }

    return response()->json($checks, $checks['status'] === 'ok' ? 200 : 503);
});

// Sprint 1 — Auth
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(JwtAuthenticate::class)->group(function () {
        Route::post('/2fa/setup', [AuthController::class, 'setup2fa']);
        Route::post('/2fa/enable', [AuthController::class, 'enable2fa']);
        Route::post('/2fa/verify', [AuthController::class, 'verify2fa']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(JwtAuthenticate::class)->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Admin-only routes (Sprint 2+)
    Route::middleware([RoleGuard::class.':administrador'])->prefix('admin')->group(function () {
        Route::get('/products', fn () => response()->json(['data' => []]));
    });

    // Vendedor + Administrador
    Route::middleware([RoleGuard::class.':vendedor,administrador'])->prefix('vendedor')->group(function () {
        // Sales routes — added in Sprint 3+
    });
});
