<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductSource;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductSource
{
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Product::with('category')->where('is_active', true);

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)
                ->orWhere('cas_number', 'like', $term)
                ->orWhere('sku', 'like', $term)
            );
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    public function findBySku(string $sku): ?Product
    {
        return Product::with('category')->where('sku', $sku)->where('is_active', true)->first();
    }

    public function findById(int $id): ?Product
    {
        return Product::with('category')->find($id);
    }

    public function create(array $data): Product
    {
        return Product::create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product->fresh('category');
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    public function allActive(): array
    {
        return Product::with('category')->where('is_active', true)->orderBy('name')->get()->toArray();
    }
}
