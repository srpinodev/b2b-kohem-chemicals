<?php

namespace App\Proxies;

use App\Models\Product;
use App\Repositories\Contracts\ProductSource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

/**
 * Proxy pattern: transparently caches read operations from the real ProductSource.
 * Write operations invalidate the cache so subsequent reads stay consistent.
 */
class CachedProductSourceProxy implements ProductSource
{
    private const TTL = 300; // 5 minutes

    private const TAG = 'products';

    public function __construct(private readonly ProductSource $repository) {}

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $key = 'catalog:page:'.md5(serialize($filters).':'.$perPage);

        return Cache::tags([self::TAG])->remember($key, self::TTL, fn () => $this->repository->paginate($filters, $perPage));
    }

    public function findBySku(string $sku): ?Product
    {
        return Cache::tags([self::TAG])->remember(
            'catalog:sku:'.$sku,
            self::TTL,
            fn () => $this->repository->findBySku($sku)
        );
    }

    public function findById(int $id): ?Product
    {
        return Cache::tags([self::TAG])->remember(
            'catalog:id:'.$id,
            self::TTL,
            fn () => $this->repository->findById($id)
        );
    }

    public function create(array $data): Product
    {
        $product = $this->repository->create($data);
        $this->flush();

        return $product;
    }

    public function update(Product $product, array $data): Product
    {
        $updated = $this->repository->update($product, $data);
        $this->flush();

        return $updated;
    }

    public function delete(Product $product): void
    {
        $this->repository->delete($product);
        $this->flush();
    }

    public function allActive(): array
    {
        return Cache::tags([self::TAG])->remember(
            'catalog:all_active',
            self::TTL,
            fn () => $this->repository->allActive()
        );
    }

    private function flush(): void
    {
        Cache::tags([self::TAG])->flush();
    }
}
