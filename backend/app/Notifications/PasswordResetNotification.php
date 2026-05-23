<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $temporaryPassword)
    {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Tu contraseña ha sido restablecida — Kohem Chemicals')
            ->greeting("Hola {$notifiable->name},")
            ->line('Un administrador ha restablecido tu contraseña.')
            ->line('**Nueva contraseña temporal:** `'.$this->temporaryPassword.'`')
            ->action('Iniciar sesión', url('/login'))
            ->line('Por seguridad, cámbiala apenas inicies sesión.')
            ->line('Si tú no solicitaste este cambio, contacta a soporte inmediatamente.');
    }
}
