<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;
    public const TYPES = ['invoice', 'proforma', 'credit_note'];

    public const STATUSES = ['draft', 'issued', 'paid', 'cancelled'];

    protected $fillable = [
        'order_id', 'company_id', 'invoice_number', 'type', 'status',
        'subtotal', 'tax_rate', 'tax_amount', 'total',
        'pdf_path', 'issued_at', 'due_date',
    ];

    protected function casts(): array
    {
        return [
            'subtotal'   => 'decimal:2',
            'tax_rate'   => 'decimal:4',
            'tax_amount' => 'decimal:2',
            'total'      => 'decimal:2',
            'issued_at'  => 'date',
            'due_date'   => 'date',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
