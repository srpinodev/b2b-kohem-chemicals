import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getOrder } from '../../services/api/orders'
import { initiateCheckout } from '../../services/api/payments'
import type { Order } from '../../services/api/orders'

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getOrder(Number(id))
      .then((r) => setOrder(r.data))
      .catch(() => setError('No se pudo cargar el pedido.'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePay = async () => {
    if (!order) return
    setProcessing(true)
    setError('')
    try {
      const origin = window.location.origin
      const res = await initiateCheckout(
        order.id,
        `${origin}/payment/return?status=success&order_id=${order.id}`,
        `${origin}/payment/return?status=cancelled&order_id=${order.id}`,
      )
      window.location.href = res.data.checkout_url
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al iniciar el pago. Intenta nuevamente.')
      setProcessing(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando pedido...</div>
  if (error && !order) return <div className="p-8 text-center text-red-600">{error}</div>
  if (!order) return null

  const subtotal = Number(order.subtotal)
  const tax = Number(order.tax_amount)
  const total = Number(order.total)

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pagar Pedido</h1>

      <div className="bg-white rounded-lg border p-5 mb-4">
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>Pedido</span>
          <span className="font-medium text-gray-900">{order.order_number}</span>
        </div>
        <div className="flex justify-between mb-1 text-sm text-gray-600">
          <span>Estado</span>
          <span className="capitalize">{order.status}</span>
        </div>
        <div className="border-t my-3" />
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span>IVA (19%)</span>
          <span>${tax.toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-base">
          <span>Total a pagar</span>
          <span>${total.toLocaleString('es-CO', { minimumFractionDigits: 0 })} COP</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        onClick={handlePay}
        disabled={processing || !['confirmed', 'processing'].includes(order.status)}
        className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 transition"
      >
        {processing ? 'Redirigiendo a Stripe...' : 'Pagar con tarjeta'}
      </button>

      {!['confirmed', 'processing'].includes(order.status) && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          El pedido debe estar confirmado para poder pagar.
        </p>
      )}

      <button
        onClick={() => navigate(`/orders/${order.id}`)}
        className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        Volver al pedido
      </button>
    </div>
  )
}
