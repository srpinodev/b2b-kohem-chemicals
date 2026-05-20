<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductSource
{
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function findBySku(string $sku): ?Product;

    public function findById(int $id): ?Product;

    public function create(array $data): Product;

    public function update(Product $product, array $data): Product;

    public function delete(Product $product): void;

    public function allActive(): array;
}
