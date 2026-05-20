<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Models\OrderStateLog;

class LogTraceabilityListener
{
    public function handle(OrderStatusChanged $event): void
    {
        OrderStateLog::create([
            'order_id'        => $event->order->id,
            'user_id'         => $event->changedBy?->id,
            'from_status'     => $event->fromStatus,
            'to_status'       => $event->toStatus,
            'transitioned_at' => now(),
        ]);
    }
}
