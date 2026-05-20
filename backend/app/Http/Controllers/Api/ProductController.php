<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'category_id']);
        $perPage = (int) $request->get('per_page', 15);

        return response()->json($this->service->list($filters, $perPage));
    }

    public function show(string $sku): JsonResponse
    {
        $product = $this->service->getBySku($sku);

        if (! $product) {
            return response()->json(['message' => 'Producto no encontrado.'], 404);
        }

        return response()->json($product);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->service->create(
            $request->except('sds'),
            $request->file('sds')
        );

        return response()->json($product->load('category'), 201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $updated = $this->service->update(
            $product,
            $request->except('sds'),
            $request->file('sds')
        );

        return response()->json($updated);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->service->delete($product);

        return response()->json(['message' => 'Producto eliminado.']);
    }
}
