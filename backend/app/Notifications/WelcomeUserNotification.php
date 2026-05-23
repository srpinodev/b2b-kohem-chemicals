<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email de bienvenida con la contraseña inicial elegida por el admin.
 * Se envía una sola vez al crear el usuario; in-app no aplica todavía porque
 * el usuario aún no tiene sesión.
 */
class WelcomeUserNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $role,
        private readonly string $temporaryPassword,
    ) {
        $this->onQueue('emails');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $roleLabel = match ($this->role) {
            'cliente'  => 'cliente',
            'vendedor' => 'vendedor',
            default    => $this->role,
        };

        return (new MailMessage)
            ->subject('Bienvenido a Kohem Chemicals')
            ->greeting("¡Hola {$notifiable->name}!")
            ->line("Se ha creado tu cuenta de {$roleLabel} en la plataforma B2B de Kohem Chemicals.")
            ->line('**Tu correo:** '.$notifiable->email)
            ->line('**Contraseña temporal:** `'.$this->temporaryPassword.'`')
            ->action('Iniciar sesión', url('/login'))
            ->line('Por seguridad, una vez inicies sesión por primera vez se te pedirá configurar una autenticación adicional.');
    }
}
