import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrder, updateOrderStatus, type Order } from '../../services/api/orders'
import { useAuthStore } from '../../store/authStore'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800', shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
}
const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'], shipped: ['delivered'],
  delivered: [], cancelled: [],
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles.some((r) => ['administrador', 'vendedor'].includes(r.name))

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (!id) return
    getOrder(Number(id)).then(({ data }) => setOrder(data)).finally(() => setLoading(false))
  }, [id])

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-400">Pedido no encontrado.</div>

  const availableTransitions = isAdmin ? TRANSITIONS[order.status] : (order.status === 'pending' ? ['cancelled'] : [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/orders')} className="text-sm text-blue-600 hover:underline mb-6 block">
          ← Mis pedidos
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(order.created_at).toLocaleString('es-CO')} · Tipo: {order.type} · Precio: {order.pricing_strategy}
              </p>
            </div>
            <span className={`text-sm px-3 py-1 rounded-full font-semibold ${STATUS_COLOR[order.status]}`}>
              {STATUS_LABEL[order.status]}
            </span>
          </div>

          {/* Items */}
          <div className="divide-y divide-gray-100 mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-xs text-gray-400">{item.product_sku} × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">${Number(item.subtotal).toLocaleString('es-CO')}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 mb-6 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${Number(order.subtotal).toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between text-gray-600"><span>IVA 19%</span><span>${Number(order.tax_amount).toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2"><span>Total</span><span>${Number(order.total).toLocaleString('es-CO')}</span></div>
          </div>

          {/* Pay button for confirmed/processing orders */}
          {['confirmed', 'processing'].includes(order.status) && (
            <div className="mb-4">
              <Link
                to={`/orders/${order.id}/checkout`}
                className="inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 transition"
              >
                Pagar pedido
              </Link>
            </div>
          )}

          {/* Transitions */}
          {availableTransitions.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {availableTransitions.map((s) => (
                <button
                  key={s}
                  disabled={transitioning}
                  onClick={() => handleTransition(s)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-60 ${s === 'cancelled' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}

          {/* State timeline */}
          {order.state_logs && order.state_logs.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Historial de estados</p>
              <div className="space-y-2">
                {order.state_logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[log.to_status]}`}>
                      {STATUS_LABEL[log.to_status]}
                    </span>
                    <span className="text-gray-400 text-xs">{new Date(log.transitioned_at).toLocaleString('es-CO')}</span>
                    {log.comment && <span className="text-gray-500 italic">"{log.comment}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
