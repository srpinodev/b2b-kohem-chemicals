<?php

namespace App\Providers;

use App\Adapters\Chatbot\ChatbotGateway;
use App\Adapters\Chatbot\FaqChatbotAdapter;
use App\Adapters\Email\EmailGateway;
use App\Adapters\Email\LaravelMailAdapter;
use App\Adapters\Payment\FakeStripeAdapter;
use App\Adapters\Payment\PaymentGateway;
use App\Adapters\Payment\StripeAdapter;
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
use App\Services\InvoiceService;
use App\Services\NotificationService;
use App\Services\PaymentService;
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

        // Adapter pattern: PaymentGateway → Stripe real cuando hay credenciales válidas,
        // FakeStripeAdapter cuando estamos en demo local con placeholders en .env.
        $this->app->singleton(PaymentGateway::class, function () {
            $secret = (string) config('services.stripe.secret');
            $hasRealStripe = $secret !== ''
                && str_starts_with($secret, 'sk_')
                && ! str_ends_with($secret, '_replace_me');

            return $hasRealStripe ? new StripeAdapter : new FakeStripeAdapter;
        });

        $this->app->singleton(PaymentService::class, fn ($app) => new PaymentService(
            $app->make(PaymentGateway::class),
            $app->make(InvoiceService::class),
        ));

        // Adapter pattern: Email (LaravelMailAdapter uses configured MAIL_* driver — Mailpit in dev)
        $this->app->singleton(EmailGateway::class, fn () => new LaravelMailAdapter);

        // Adapter pattern: Chatbot (FAQ rule-based; swap for BotPress adapter when available)
        $this->app->singleton(ChatbotGateway::class, fn () => new FaqChatbotAdapter);
    }

    public function boot(): void
    {
        
    }
}
