import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../../services/api/orders'
import { useCartStore } from '../../store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, clear, subtotal } = useCartStore()
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tax = subtotal() * 0.19
  const total = subtotal() + tax

  async function handleCheckout() {
    if (items.length === 0) return
    setError('')
    setLoading(true)
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        notes: notes || undefined,
      }
      const { data } = await createOrder(payload)
      clear()
      navigate(`/orders/${data.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al crear el pedido.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Tu carrito está vacío.</p>
        <button onClick={() => navigate('/catalog')} className="text-blue-600 hover:underline">
          ← Ir al catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/catalog')} className="text-sm text-blue-600 hover:underline mb-6 block">
          ← Seguir comprando
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Carrito de compras</h1>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-6">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-400">{product.sku} · {product.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-7 h-7 rounded border text-gray-600 hover:bg-gray-100">−</button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-7 h-7 rounded border text-gray-600 hover:bg-gray-100">+</button>
              </div>
              <div className="text-right min-w-[100px]">
                <p className="font-semibold text-gray-900">${(Number(product.price) * quantity).toLocaleString('es-CO')}</p>
                <p className="text-xs text-gray-400">${Number(product.price).toLocaleString('es-CO')}/{product.unit}</p>
              </div>
              <button onClick={() => removeItem(product.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas del pedido (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Instrucciones especiales de entrega..."
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal().toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA (19%)</span>
              <span>${tax.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
              <span>Total</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Confirmando pedido...' : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
