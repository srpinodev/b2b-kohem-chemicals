<?php

namespace App\Providers;

use App\Events\OrderConfirmed;
use App\Events\OrderStatusChanged;
use App\Listeners\GenerateInvoiceListener;
use App\Listeners\LogTraceabilityListener;
use App\Listeners\SendOrderConfirmationEmailListener;
use App\Listeners\UpdateInventoryListener;
use App\Proxies\CachedProductSourceProxy;
use App\Repositories\Contracts\ProductSource;
use App\Repositories\Eloquent\EloquentProductRepository;
use App\Services\AuthService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use PragmaRX\Google2FA\Google2FA;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Google2FA::class, fn () => new Google2FA);

        $this->app->singleton(AuthService::class, fn ($app) => new AuthService(
            $app->make(Google2FA::class)
        ));

        $this->app->singleton(ProductSource::class, fn () => new CachedProductSourceProxy(
            new EloquentProductRepository
        ));
    }

    public function boot(): void
    {
        // Observer pattern: register listeners for domain events
        Event::listen(OrderConfirmed::class, UpdateInventoryListener::class);
        Event::listen(OrderConfirmed::class, SendOrderConfirmationEmailListener::class);
        Event::listen(OrderConfirmed::class, GenerateInvoiceListener::class);
        Event::listen(OrderStatusChanged::class, LogTraceabilityListener::class);
    }
}
