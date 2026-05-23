<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Models\User;
use App\Notifications\PasswordResetNotification;
use App\Notifications\WelcomeUserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Gestión de usuarios para el administrador. No expone `administrador` como rol
 * asignable: solo se crean clientes y vendedores. El admin propio no puede
 * desactivarse a sí mismo ni resetear su propia contraseña por este endpoint.
 */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 15);
        $query = User::with(['roles', 'company'])->orderBy('name');

        if ($role = $request->get('role')) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        if ($search = $request->get('search')) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        return response()->json($query->paginate($perPage));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => $data['password'],
            'company_id' => $data['company_id'] ?? null,
            'is_active'  => $data['is_active'] ?? true,
        ]);

        $user->assignRole($data['role']);

        // Email de bienvenida con la contraseña inicial — encolado, no bloquea la respuesta.
        $user->notify(new WelcomeUserNotification($data['role'], $data['password']));

        return response()->json($user->load(['roles', 'company']), 201);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'No puedes desactivar tu propio usuario.'], 422);
        }

        if ($user->hasRole('administrador')) {
            return response()->json(['message' => 'No se permite desactivar administradores por este endpoint.'], 422);
        }

        $user->update(['is_active' => false]);

        return response()->json(['message' => 'Usuario desactivado.', 'user' => $user->fresh(['roles', 'company'])]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'No puedes resetear tu propia contraseña por este endpoint.'], 422);
        }

        // Contraseña temporal alfanumérica de 12 chars. Se devuelve UNA vez al admin
        // para que la comunique al usuario; al cifrarse con el cast 'hashed', el
        // backend no podrá recuperarla después.
        $temp = Str::password(12, symbols: false);
        $user->update(['password' => $temp]);

        // Email al usuario afectado con su nueva contraseña temporal.
        $user->notify(new PasswordResetNotification($temp));

        return response()->json([
            'message'            => 'Contraseña restablecida. También se envió un correo al usuario.',
            'temporary_password' => $temp,
        ]);
    }
}
