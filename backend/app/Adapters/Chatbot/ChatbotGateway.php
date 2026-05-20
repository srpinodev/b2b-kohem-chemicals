<?php

namespace App\Adapters\Chatbot;

interface ChatbotGateway
{
    /**
     * Process a user message and return a response.
     */
    public function reply(string $message, string $sessionId): ChatbotResponse;
}
