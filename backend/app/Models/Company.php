<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'nit',
        'address',
        'city',
        'phone',
        'contact_name',
        'is_distributor',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_distributor' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function creditLimit(): HasOne
    {
        return $this->hasOne(CreditLimit::class);
    }
}
