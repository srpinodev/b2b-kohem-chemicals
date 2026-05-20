<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Models\OrderStateLog;
use App\Services\NotificationService;

class LogTraceabilityListener
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function handle(OrderStatusChanged $event): void
    {
        OrderStateLog::create([
            'order_id'        => $event->order->id,
            'user_id'         => $event->changedBy?->id,
            'from_status'     => $event->fromStatus,
            'to_status'       => $event->toStatus,
            'transitioned_at' => now(),
        ]);

        if ($event->toStatus !== 'pending') {
            $this->notificationService->notifyOrderStatusChange(
                $event->order,
                $event->fromStatus,
                $event->toStatus,
            );
        }
    }
}
