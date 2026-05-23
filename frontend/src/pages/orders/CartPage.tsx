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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white rounded-2xl border border-dust-200 p-10 inline-flex flex-col items-center gap-3 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-dust-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-gunmetal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gunmetal-700 font-medium">Tu carrito está vacío</p>
          <p className="text-sm text-gunmetal-400">Explora el catálogo y agrega productos.</p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-2 inline-flex items-center gap-2 bg-gunmetal-600 hover:bg-gunmetal-700 text-dust-50 px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            Ir al catálogo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate('/catalog')}
        className="text-sm text-pine-500 hover:text-pine-700 hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Seguir comprando
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gunmetal-800 mb-1">Carrito de compras</h1>
      <p className="text-sm text-gunmetal-400 mb-6">
        {items.length} producto{items.length !== 1 ? 's' : ''} en tu carrito.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-dust-200 divide-y divide-dust-200">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-pine-100 text-pine-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {product.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gunmetal-800 truncate">{product.name}</p>
                  <p className="text-xs text-gunmetal-400">
                    <span className="font-mono">{product.sku}</span> · {product.unit}
                  </p>
                </div>
                <div className="inline-flex items-center bg-dust-50 border border-dust-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-7 h-7 text-gunmetal-600 hover:bg-dust-200 transition"
                    aria-label="Disminuir"
                  >−</button>
                  <span className="w-10 text-center text-sm font-medium text-gunmetal-800">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-7 h-7 text-gunmetal-600 hover:bg-dust-200 transition"
                    aria-label="Aumentar"
                  >+</button>
                </div>
                <div className="text-right min-w-[110px]">
                  <p className="font-semibold text-gunmetal-800">
                    ${(Number(product.price) * quantity).toLocaleString('es-CO')}
                  </p>
                  <p className="text-xs text-gunmetal-400">
                    ${Number(product.price).toLocaleString('es-CO')}/{product.unit}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-gunmetal-300 hover:text-red-600 transition w-8 h-8 flex items-center justify-center rounded"
                  aria-label="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-dust-200 p-5">
            <label className="block text-sm font-medium text-gunmetal-700 mb-1.5">
              Notas del pedido <span className="text-gunmetal-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition resize-none"
              placeholder="Instrucciones especiales de entrega, dirección alternativa, contacto..."
            />
          </div>
        </div>

        <aside className="bg-white rounded-xl border border-dust-200 p-5 lg:sticky lg:top-20">
          <p className="text-xs uppercase tracking-wider font-semibold text-pine-500 mb-3">Resumen</p>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-gunmetal-600">
              <span>Subtotal</span>
              <span>${subtotal().toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-gunmetal-600">
              <span>IVA (19%)</span>
              <span>${tax.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold text-gunmetal-800 border-t border-dust-200 pt-3 text-base">
              <span>Total</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-gold-400 hover:bg-gold-500 disabled:opacity-60 disabled:cursor-not-allowed text-gunmetal-800 font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            {loading ? 'Confirmando pedido...' : 'Confirmar pedido'}
          </button>
          <p className="text-[11px] text-gunmetal-400 mt-3 text-center">
            Tu pedido quedará pendiente de confirmación por el vendedor.
          </p>
        </aside>
      </div>
    </div>
  )
}
