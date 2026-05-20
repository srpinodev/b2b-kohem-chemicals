<?php

namespace App\Listeners;

use App\Events\OrderConfirmed;

class UpdateInventoryListener
{
    public function handle(OrderConfirmed $event): void
    {
        foreach ($event->order->items as $item) {
            $item->product()->decrement('stock', $item->quantity);
        }
    }
}
