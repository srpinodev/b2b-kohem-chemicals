<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\User;
use App\Notifications\InvoiceReadyNotification;
use App\Notifications\OrderStatusNotification;
use Illuminate\Notifications\DatabaseNotification;

class NotificationService
{
    public function notifyOrderStatusChange(Order $order, string $fromStatus, string $toStatus): void
    {
        $user = $order->user;
        if (! $user) {
            return;
        }

        $user->notify(new OrderStatusNotification($order, $fromStatus, $toStatus));
    }

    public function notifyInvoiceReady(Invoice $invoice): void
    {
        $invoice->loadMissing('order.user');
        $user = $invoice->order?->user;
        if (! $user) {
            return;
        }

        $user->notify(new InvoiceReadyNotification($invoice));
    }

    public function forUser(User $user, int $perPage = 20): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $user->notifications()->paginate($perPage);
    }

    public function markRead(DatabaseNotification $notification, User $user): void
    {
        if ($notification->notifiable_id !== $user->id) {
            throw new \RuntimeException('Notification does not belong to user.');
        }

        $notification->markAsRead();
    }

    public function markAllRead(User $user): int
    {
        return $user->unreadNotifications()->update(['read_at' => now()]);
    }
}
