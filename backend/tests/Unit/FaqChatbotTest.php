<?php

namespace Tests\Unit;

use App\Adapters\Chatbot\FaqChatbotAdapter;
use PHPUnit\Framework\TestCase;

class FaqChatbotTest extends TestCase
{
    private FaqChatbotAdapter $bot;

    protected function setUp(): void
    {
        $this->bot = new FaqChatbotAdapter;
    }

    public function test_greets_on_hello(): void
    {
        $response = $this->bot->reply('hola', 'sess1');

        $this->assertStringContainsStringIgnoringCase('bienvenido', $response->text);
        $this->assertEquals('sess1', $response->sessionId);
    }

    public function test_answers_price_query(): void
    {
        $response = $this->bot->reply('¿cuánto cuesta el sulfúrico?', 'sess1');

        $this->assertStringContainsStringIgnoringCase('precio', $response->text);
    }

    public function test_answers_invoice_query(): void
    {
        $response = $this->bot->reply('Necesito mi factura', 'sess1');

        $this->assertStringContainsStringIgnoringCase('factura', $response->text);
    }

    public function test_returns_fallback_for_unknown(): void
    {
        $response = $this->bot->reply('Quiero un unicornio', 'sess1');

        $this->assertStringContainsStringIgnoringCase('no entendí', $response->text);
    }

    public function test_preserves_session_id(): void
    {
        $response = $this->bot->reply('pago', 'my-session-abc');

        $this->assertEquals('my-session-abc', $response->sessionId);
    }
}
