<?php

namespace App\Services;

use App\Events\OrderConfirmed;
use App\Events\OrderStatusChanged;
use App\Factories\Order\OrderFactory;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Repositories\Contracts\ProductSource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OrderService
{
    private const TAX_RATE = 0.19; // IVA Colombia 19%

    public function __construct(private readonly ProductSource $products) {}

    public function create(User $user, array $data): Order
    {
        return DB::transaction(function () use ($user, $data) {
            // Factory Method: get the right factory for this customer
            $factory = OrderFactory::forCustomer($user);
            $strategy = $factory->pricingStrategy();

            $order = $factory->createOrder($user, $data);
            $order->save();

            $subtotal = 0.0;

            foreach ($data['items'] as $item) {
                $product = $this->products->findById($item['product_id']);

                if (! $product || ! $product->is_active) {
                    throw new \RuntimeException("Producto {$item['product_id']} no disponible.");
                }

                if ($product->stock < $item['quantity']) {
                    throw new \RuntimeException("Stock insuficiente para {$product->name}.");
                }

                // Strategy: calculate price based on customer type + quantity
                $unitPrice = $strategy->calculateUnitPrice($product, $item['quantity']);
                $lineTotal = round($unitPrice * $item['quantity'], 2);

                $order->items()->create([
                    'product_id'   => $product->id,
                    'product_sku'  => $product->sku,
                    'product_name' => $product->name,
                    'unit_price'   => $unitPrice,
                    'quantity'     => $item['quantity'],
                    'subtotal'     => $lineTotal,
                ]);

                $subtotal += $lineTotal;
            }

            $tax = round($subtotal * self::TAX_RATE, 2);
            $order->update([
                'subtotal'   => $subtotal,
                'tax_amount' => $tax,
                'total'      => round($subtotal + $tax, 2),
            ]);

            // Observer: dispatch initial status log
            OrderStatusChanged::dispatch($order, '', 'pending', $user);

            return $order->load(['items.product', 'company']);
        });
    }

    public function listForUser(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Order::with(['items', 'company'])->where('user_id', $user->id);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest()->paginate(15);
    }

    public function listAll(array $filters = []): LengthAwarePaginator
    {
        $query = Order::with(['items', 'user', 'company']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query->latest()->paginate(15);
    }

    public function find(int $id): ?Order
    {
        return Order::with(['items.product', 'company', 'stateLogs.user'])->find($id);
    }

    public function transition(Order $order, string $toStatus, User $changedBy, ?string $comment = null): Order
    {
        if (! $order->canTransitionTo($toStatus)) {
            throw new \RuntimeException(
                "No se puede pasar de '{$order->status}' a '{$toStatus}'."
            );
        }

        $fromStatus = $order->status;
        $order->update(['status' => $toStatus]);

        // Observer: log every status transition for traceability
        OrderStatusChanged::dispatch($order, $fromStatus, $toStatus, $changedBy);

        // Observer: fire OrderConfirmed when order moves to confirmed
        if ($toStatus === 'confirmed') {
            $order->load('items.product');
            OrderConfirmed::dispatch($order);
        }

        return $order->fresh(['items.product', 'company', 'stateLogs.user']);
    }
}
