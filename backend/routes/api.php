<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
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

// Sprint 2 — Catalog (public read)
Route::prefix('catalog')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{sku}', [ProductController::class, 'show']);
});

Route::middleware(JwtAuthenticate::class)->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Admin + Vendedor — product management
    Route::middleware([RoleGuard::class.':administrador,vendedor'])->prefix('admin')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    });

    // Vendedor routes (Sprint 3+)
    Route::middleware([RoleGuard::class.':vendedor,administrador'])->prefix('vendedor')->group(function () {
        // Orders — Sprint 3
    });
});
