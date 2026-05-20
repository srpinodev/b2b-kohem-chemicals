<?php

namespace App\Providers;

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
    }

    public function boot(): void
    {
        //
    }
}
