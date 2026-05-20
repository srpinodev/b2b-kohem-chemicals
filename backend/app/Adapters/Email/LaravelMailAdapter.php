<?php

namespace App\Adapters\Email;

use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\Message;

class LaravelMailAdapter implements EmailGateway
{
    public function send(array $to, string $subject, string $template, array $data = []): void
    {
        Mail::send(
            "emails.{$template}",
            $data,
            function (Message $message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            }
        );
    }
}
