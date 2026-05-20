<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditLimit extends Model
{
    protected $fillable = [
        'company_id',
        'limit_amount',
        'used_amount',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'limit_amount' => 'decimal:2',
            'used_amount' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function availableAmount(): float
    {
        return (float) $this->limit_amount - (float) $this->used_amount;
    }
}
