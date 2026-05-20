<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/*
|--------------------------------------------------------------------------
| API Routes — Kohem Chemicals B2B
|--------------------------------------------------------------------------
|
| Sprint 0: health check
| Sprint 1: auth, users, companies (se agrega aquí)
| Sprint 2: catalog, products
| Sprint 3: orders
| Sprint 4: invoices, payments
| Sprint 5: notifications, chatbot
|
*/

Route::get('/health', function () {
    $checks = [
        'status' => 'ok',
        'app'    => config('app.name'),
        'env'    => config('app.env'),
    ];

    try {
        DB::connection()->getPdo();
        $checks['database'] = 'ok';
    } catch (\Exception $e) {
        $checks['database'] = 'error: ' . $e->getMessage();
        $checks['status'] = 'degraded';
    }

    try {
        Cache::store('redis')->put('health_ping', true, 5);
        $checks['redis'] = Cache::store('redis')->get('health_ping') ? 'ok' : 'error';
    } catch (\Exception $e) {
        $checks['redis'] = 'error: ' . $e->getMessage();
        $checks['status'] = 'degraded';
    }

    $statusCode = $checks['status'] === 'ok' ? 200 : 503;

    return response()->json($checks, $statusCode);
});
