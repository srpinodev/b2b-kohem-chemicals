<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderStateLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id', 'user_id', 'from_status', 'to_status', 'comment', 'transitioned_at',
    ];

    protected function casts(): array
    {
        return ['transitioned_at' => 'datetime'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
