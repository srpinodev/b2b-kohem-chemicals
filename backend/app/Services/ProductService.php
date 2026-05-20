<?php

namespace App\Services;

use App\Models\Product;
use App\Repositories\Contracts\ProductSource;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ProductService
{
    public function __construct(private readonly ProductSource $source) {}

    public function list(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->source->paginate($filters, $perPage);
    }

    public function getBySku(string $sku): ?Product
    {
        return $this->source->findBySku($sku);
    }

    public function create(array $data, ?UploadedFile $sds = null): Product
    {
        if ($sds) {
            $data['sds_url'] = $sds->store('sds', 'public');
        }

        return $this->source->create($data);
    }

    public function update(Product $product, array $data, ?UploadedFile $sds = null): Product
    {
        if ($sds) {
            $data['sds_url'] = $sds->store('sds', 'public');
        }

        return $this->source->update($product, $data);
    }

    public function delete(Product $product): void
    {
        $this->source->delete($product);
    }

    public function generateSku(string $name): string
    {
        return strtoupper(Str::slug($name, '-')).'-'.strtoupper(Str::random(4));
    }
}
