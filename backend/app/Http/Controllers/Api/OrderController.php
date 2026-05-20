<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateStatusRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $service) {}

    public function index(Request $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $filters = $request->only(['status']);

        $orders = $user->hasAnyRole(['administrador', 'vendedor'])
            ? $this->service->listAll(array_merge($filters, $request->only('user_id')))
            : $this->service->listForUser($user, $filters);

        return response()->json($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        try {
            $order = $this->service->create($user, $request->validated());
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($order, 201);
    }

    public function show(int $id): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();
        $order = $this->service->find($id);

        if (! $order) {
            return response()->json(['message' => 'Pedido no encontrado.'], 404);
        }

        // Clients can only see their own orders
        if ($user->hasRole('cliente') && $order->user_id !== $user->id) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        return response()->json($order);
    }

    public function updateStatus(UpdateStatusRequest $request, Order $order): JsonResponse
    {
        $user = JWTAuth::parseToken()->authenticate();

        // Only admin/vendor can change status; clients can only cancel their own
        if ($user->hasRole('cliente')) {
            if ($order->user_id !== $user->id || $request->status !== 'cancelled') {
                return response()->json(['message' => 'Acceso no autorizado.'], 403);
            }
        }

        try {
            $updated = $this->service->transition($order, $request->status, $user, $request->comment);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($updated);
    }
}
