<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\UserController;
use App\Http\Middleware\JwtAuthenticate;
use App\Http\Middleware\RoleGuard;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    $checks = ['status' => 'ok', 'app' => config('app.name'), 'env' => config('app.env')];
    try { DB::connection()->getPdo(); $checks['database'] = 'ok'; }
    catch (\Exception $e) { $checks['database'] = 'error: '.$e->getMessage(); $checks['status'] = 'degraded'; }
    try {
        Cache::store('redis')->put('health_ping', true, 5);
        $checks['redis'] = Cache::store('redis')->get('health_ping') ? 'ok' : 'error';
    } catch (\Exception $e) { $checks['redis'] = 'error: '.$e->getMessage(); $checks['status'] = 'degraded'; }
    return response()->json($checks, $checks['status'] === 'ok' ? 200 : 503);
});

// Sprint 1 — Auth (throttle más estricto: 10 intentos/min para prevenir fuerza bruta)
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
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

Route::get('/categories', fn () => Category::where('is_active', true)->orderBy('name')->get());

Route::middleware(JwtAuthenticate::class)->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    // Sprint 3 — Orders
    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Sprint 4 — Invoices
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf']);

    // Sprint 4 — Checkout (OTP por email antes del checkout real)
    Route::post('/orders/{order}/payment-code', [PaymentController::class, 'requestCode']);
    Route::post('/orders/{order}/checkout', [PaymentController::class, 'checkout']);

    // Sprint 5 — Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Sprint 5 — Chatbot
    Route::post('/chatbot/message', [ChatbotController::class, 'message']);

    // Admin + Vendedor — product management
    Route::middleware([RoleGuard::class.':administrador,vendedor'])->prefix('admin')->group(function () {
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::post('/products/{product}', [ProductController::class, 'update']); // multipart POST con _method=PUT (uploads)
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    });

    // Admin solo — user management
    Route::middleware([RoleGuard::class.':administrador'])->prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::post('/users/{user}/reset-2fa', [UserController::class, 'resetTwoFactor']);
    });
});

// Sprint 4 — Payment webhook (no JWT auth — Stripe signs the payload)
Route::post('/webhooks/stripe', [PaymentController::class, 'webhook']);

// Sprint 4 — Pasarela simulada para demo local (solo activa cuando FakeStripeAdapter está enlazado)
Route::get('/payments/fake/complete', [PaymentController::class, 'fakeComplete']);
