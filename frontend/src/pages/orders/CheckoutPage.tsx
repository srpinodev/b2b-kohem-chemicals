import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getOrder } from '../../services/api/orders'
import { initiateCheckout, requestPaymentCode } from '../../services/api/payments'
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

  // Flujo OTP: idle → requesting → otpSent (esperando código) → verifying → redirecting
  const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verifying'>('idle')
  const [otpCode, setOtpCode] = useState('')
  const [otpTtl, setOtpTtl] = useState<number | null>(null)
  const [sendingCode, setSendingCode] = useState(false)

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

  const handleRequestCode = async () => {
    if (!order) return
    setError('')
    setSendingCode(true)
    try {
      const r = await requestPaymentCode(order.id)
      setOtpTtl(r.data.ttl_minutes)
      setOtpStep('sent')
      setOtpCode('')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No se pudo enviar el código. Intenta nuevamente.')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyAndPay = async () => {
    if (!order || otpCode.length !== 6) return
    setProcessing(true)
    setOtpStep('verifying')
    setError('')
    try {
      const origin = window.location.origin
      const res = await initiateCheckout(
        order.id,
        `${origin}/payment/return?status=success&order_id=${order.id}`,
        `${origin}/payment/return?status=cancelled&order_id=${order.id}`,
        otpCode,
      )
      window.location.href = res.data.checkout_url
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al procesar el pago.')
      setProcessing(false)
      setOtpStep('sent')
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

      {!canPay ? (
        <p className="text-sm text-gunmetal-500 mt-3 text-center">
          El pedido debe estar confirmado para poder pagar.
        </p>
      ) : otpStep === 'idle' ? (
        <button
          onClick={handleRequestCode}
          disabled={sendingCode}
          className="w-full bg-gold-400 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-gunmetal-800 py-3 rounded-xl font-semibold transition shadow-sm flex items-center justify-center gap-2"
          data-testid="request-code-btn"
        >
          {sendingCode ? (
            <>
              <span className="w-4 h-4 border-2 border-gunmetal-800 border-t-transparent rounded-full animate-spin" />
              Enviando código…
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
      ) : (
        <div className="bg-white rounded-2xl border border-dust-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-pine-100 text-pine-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gunmetal-800">Verifica el pago</p>
              <p className="text-xs text-gunmetal-500">
                Enviamos un código de 6 dígitos a tu correo. Vence en {otpTtl ?? 10} min.
              </p>
            </div>
          </div>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            autoFocus
            placeholder="000000"
            className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-dust-50 border border-dust-300 rounded-lg px-3 py-3 text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 transition mb-3"
            data-testid="otp-input"
          />

          <button
            onClick={handleVerifyAndPay}
            disabled={otpCode.length !== 6 || processing}
            className="w-full bg-gold-400 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-gunmetal-800 py-3 rounded-xl font-semibold transition shadow-sm flex items-center justify-center gap-2"
            data-testid="verify-pay-btn"
          >
            {processing ? (
              <>
                <span className="w-4 h-4 border-2 border-gunmetal-800 border-t-transparent rounded-full animate-spin" />
                Verificando y redirigiendo…
              </>
            ) : (
              'Verificar y pagar'
            )}
          </button>

          <button
            onClick={handleRequestCode}
            disabled={sendingCode || processing}
            className="w-full mt-2 text-sm text-pine-500 hover:text-pine-700 hover:underline disabled:opacity-50"
          >
            {sendingCode ? 'Reenviando…' : 'Reenviar código'}
          </button>
        </div>
      )}
    </div>
  )
}
