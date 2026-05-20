<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sku' => ['required', 'string', 'max:50', 'unique:products'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'cas_number' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'unit' => ['required', 'string', 'max:30'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'sds' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'requires_special_handling' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
