<?php

namespace App\Adapters\Email;

interface EmailGateway
{
    /**
     * Send a transactional email.
     *
     * @param string[] $to
     * @param array<string, mixed> $data  Template variables
     */
    public function send(array $to, string $subject, string $template, array $data = []): void;
}
