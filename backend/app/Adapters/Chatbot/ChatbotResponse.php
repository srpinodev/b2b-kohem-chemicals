<?php

namespace App\Adapters\Chatbot;

final class ChatbotResponse
{
    public function __construct(
        public readonly string $text,
        public readonly string $sessionId,
    ) {}
}
