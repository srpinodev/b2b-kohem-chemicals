import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getOrder } from '../../services/api/orders'
import { initiateCheckout } from '../../services/api/payments'
import type { Order } from '../../services/api/orders'
import { useAuthStore } from '../../store/authStore'
import { useRealtimeStore } from '../../store/realtimeStore'
import { usePolling } from '../../hooks/usePolling'

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const notificationTick = useRealtimeStore((s) => s.notificationTick)
  const currentUserId = useAuthStore((s) => s.user?.id)

  const refresh = useCallback(async () => {
    if (!id) return
    try {
      const r = await getOrder(Number(id))
      setOrder(r.data)
    } catch {
      setError('No se pudo cargar el pedido.')
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [id, refresh])

  useEffect(() => {
    if (!id || notificationTick === 0) return
    void refresh()
  }, [notificationTick, id, refresh])

  usePolling(refresh, { intervalMs: 5_000, enabled: !!id && !processing })

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

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-2xl border border-dust-200 p-8 animate-pulse h-72" />
    </div>
  )
  if (error && !order) return (
    <div className="max-w-lg mx-auto px-6 py-10 text-center text-red-600">{error}</div>
  )
  if (!order) return null

  // El pago pertenece al cliente que creó el pedido. Vendedores/admins que entren
  // por URL directa son redirigidos al detalle del pedido (donde no verán botón de pagar).
  if (currentUserId && order.user_id !== currentUserId) {
    return <Navigate to={`/orders/${order.id}`} replace />
  }

  const subtotal = Number(order.subtotal)
  const tax = Number(order.tax_amount)
  const total = Number(order.total)
  const canPay = ['confirmed', 'processing'].includes(order.status)

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate(`/orders/${order.id}`)}
        className="text-sm text-pine-500 hover:text-pine-700 hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Volver al pedido
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gunmetal-800 mb-1">Pagar pedido</h1>
      <p className="text-sm text-gunmetal-400 mb-6">
        Serás redirigido al procesador seguro para completar el pago.
      </p>

      <div className="bg-white rounded-2xl border border-dust-200 shadow-sm overflow-hidden mb-4">
        <div className="bg-gunmetal-600 text-dust-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gold-300">Pedido</p>
            <p className="font-mono font-semibold text-dust-50">{order.order_number}</p>
          </div>
          <span className="text-[11px] uppercase font-semibold px-2 py-1 rounded-full bg-pine-400 text-dust-50">
            {order.status}
          </span>
        </div>

        <div className="p-5 space-y-2 text-sm">
          <div className="flex justify-between text-gunmetal-600">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-gunmetal-600">
            <span>IVA (19%)</span>
            <span>${tax.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between font-bold text-gunmetal-800 border-t border-dust-200 pt-3 mt-2 text-base">
            <span>Total a pagar</span>
            <span>${total.toLocaleString('es-CO')} COP</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={processing || !canPay}
        className="w-full bg-gold-400 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-gunmetal-800 py-3 rounded-xl font-semibold transition shadow-sm flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <span className="w-4 h-4 border-2 border-gunmetal-800 border-t-transparent rounded-full animate-spin" />
            Redirigiendo a Stripe...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pagar con tarjeta
          </>
        )}
      </button>

      {!canPay && (
        <p className="text-sm text-gunmetal-500 mt-3 text-center">
          El pedido debe estar confirmado para poder pagar.
        </p>
      )}
    </div>
  )
}
