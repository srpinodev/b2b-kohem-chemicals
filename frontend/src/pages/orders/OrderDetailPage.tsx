import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrder, updateOrderStatus, type Order } from '../../services/api/orders'
import { useAuthStore } from '../../store/authStore'
import { useRealtimeStore } from '../../store/realtimeStore'
import { usePolling } from '../../hooks/usePolling'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-gold-100 text-gold-700 border-gold-200',
  confirmed: 'bg-pine-100 text-pine-700 border-pine-200',
  processing: 'bg-pine-100 text-pine-700 border-pine-200',
  shipped: 'bg-gunmetal-100 text-gunmetal-700 border-gunmetal-200',
  delivered: 'bg-pine-200 text-pine-800 border-pine-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles.some((r) => ['administrador', 'vendedor'].includes(r.name))

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const notificationTick = useRealtimeStore((s) => s.notificationTick)

  const refresh = useCallback(async () => {
    if (!id) return
    const { data } = await getOrder(Number(id))
    setOrder(data)
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [id, refresh])

  // Re-fetch inmediato cuando llega una notificación nueva al usuario.
  useEffect(() => {
    if (!id || notificationTick === 0) return
    void refresh()
  }, [notificationTick, id, refresh])

  usePolling(refresh, { intervalMs: 5_000, enabled: !!id })

  async function handleTransition(status: string) {
    if (!order) return
    setTransitioning(true)
    try {
      const { data } = await updateOrderStatus(order.id, status)
      setOrder(data)
    } finally {
      setTransitioning(false)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-2xl border border-dust-200 p-8 animate-pulse h-96" />
    </div>
  )
  if (!order) return (
    <div className="min-h-[60vh] flex items-center justify-center text-gunmetal-400">
      Pedido no encontrado.
    </div>
  )

  const isOwner = order.user_id === user?.id
  const canPay = isOwner && ['confirmed', 'processing'].includes(order.status)
  const availableTransitions = isAdmin
    ? TRANSITIONS[order.status]
    : (isOwner && order.status === 'pending' ? ['cancelled'] : [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate('/orders')}
        className="text-sm text-pine-500 hover:text-pine-700 hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Mis pedidos
      </button>

      <div className="bg-white rounded-2xl border border-dust-200 shadow-sm overflow-hidden">
        <div className="bg-gunmetal-600 text-dust-100 px-8 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-gold-300 mb-1">Pedido</p>
              <h1 className="text-2xl font-bold text-dust-50 font-mono">{order.order_number}</h1>
              <p className="text-xs text-dust-300 mt-1">
                {new Date(order.created_at).toLocaleString('es-CO')} · Tipo: {order.type} · Estrategia: {order.pricing_strategy}
              </p>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${STATUS_STYLE[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
          </div>
        </div>

        <div className="p-8">
          {/* Items */}
          <p className="text-xs uppercase tracking-wider font-semibold text-pine-500 mb-3">Productos</p>
          <div className="divide-y divide-dust-200 mb-6 border border-dust-200 rounded-lg overflow-hidden">
            {order.items.map((item) => (
              <div key={item.id} className="px-4 py-3 flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gunmetal-800 truncate">{item.product_name}</p>
                  <p className="text-xs text-gunmetal-400">
                    <span className="font-mono">{item.product_sku}</span> × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gunmetal-800">
                  ${Number(item.subtotal).toLocaleString('es-CO')}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-dust-50 rounded-lg p-4 mb-6 space-y-1.5 text-sm">
            <div className="flex justify-between text-gunmetal-600">
              <span>Subtotal</span>
              <span>${Number(order.subtotal).toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-gunmetal-600">
              <span>IVA 19%</span>
              <span>${Number(order.tax_amount).toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold text-gunmetal-800 border-t border-dust-200 pt-2 text-base">
              <span>Total</span>
              <span>${Number(order.total).toLocaleString('es-CO')}</span>
            </div>
          </div>

          {canPay && (
            <div className="mb-6">
              <Link
                to={`/orders/${order.id}/checkout`}
                className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-gunmetal-800 px-5 py-2.5 rounded-lg font-semibold text-sm transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pagar pedido
              </Link>
            </div>
          )}

          {availableTransitions.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-semibold text-pine-500 mb-3">
                Cambiar estado
              </p>
              <div className="flex gap-2 flex-wrap">
                {availableTransitions.map((s) => (
                  <button
                    key={s}
                    disabled={transitioning}
                    onClick={() => handleTransition(s)}
                    className={[
                      'px-4 py-2 text-sm rounded-lg font-medium transition disabled:opacity-60',
                      s === 'cancelled'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-pine-100 text-pine-700 hover:bg-pine-200 border border-pine-200',
                    ].join(' ')}
                  >
                    → {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* State timeline */}
          {order.state_logs && order.state_logs.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-pine-500 mb-3">
                Historial
              </p>
              <ol className="relative border-l border-dust-300 ml-2 space-y-3">
                {order.state_logs.map((log) => (
                  <li key={log.id} className="ml-4">
                    <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-gold-400 border-2 border-white" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLE[log.to_status]}`}>
                        {STATUS_LABEL[log.to_status]}
                      </span>
                      <span className="text-xs text-gunmetal-400">
                        {new Date(log.transitioned_at).toLocaleString('es-CO')}
                      </span>
                    </div>
                    {log.comment && (
                      <p className="text-xs text-gunmetal-500 italic mt-1">"{log.comment}"</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
