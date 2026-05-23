<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'   => ['required', 'string', 'min:8', 'max:72'],
            'role'       => ['required', Rule::in(['cliente', 'vendedor'])],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'is_active'  => ['boolean'],
        ];
    }
}
