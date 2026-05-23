<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorResetNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
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
            ->subject('Tu 2FA fue restablecido — Kohem Chemicals')
            ->greeting("Hola {$notifiable->name},")
            ->line('Un administrador restableció tu autenticación en dos pasos.')
            ->line('La próxima vez que inicies sesión te pediremos configurarla de nuevo desde cero.')
            ->action('Iniciar sesión', url('/login'))
            ->line('Si no esperabas este cambio, contacta a soporte de inmediato.');
    }
}
