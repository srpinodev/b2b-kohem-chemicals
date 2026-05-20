<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'sku' => ['sometimes', 'string', 'max:50', Rule::unique('products')->ignore($productId)],
            'name' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'cas_number' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'unit' => ['sometimes', 'string', 'max:30'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'sds' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'requires_special_handling' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
