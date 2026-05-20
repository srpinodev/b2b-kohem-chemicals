<?php

namespace App\Http\Controllers\Api;

use App\Adapters\Chatbot\ChatbotGateway;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChatMessageRequest;

class ChatbotController extends Controller
{
    public function __construct(private readonly ChatbotGateway $chatbot) {}

    public function message(ChatMessageRequest $request)
    {
        $sessionId = $request->input('session_id', session()->getId());
        $response  = $this->chatbot->reply(
            $request->input('message'),
            $sessionId,
        );

        return response()->json([
            'reply'      => $response->text,
            'session_id' => $response->sessionId,
        ]);
    }
}
