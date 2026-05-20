<?php

namespace App\Providers;

use App\Proxies\CachedProductSourceProxy;
use App\Repositories\Contracts\ProductSource;
use App\Repositories\Eloquent\EloquentProductRepository;
use App\Services\AuthService;
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

        // Bind ProductSource to the Proxy, which wraps the real repository.
        // Any class that depends on ProductSource gets the cached version transparently.
        $this->app->singleton(ProductSource::class, fn () => new CachedProductSourceProxy(
            new EloquentProductRepository
        ));
    }

    public function boot(): void
    {
        //
    }
}
