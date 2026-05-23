import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrders, type Order } from '../../services/api/orders'

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

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrders().then(({ data }) => setOrders(data.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-1">Historial</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gunmetal-800">Mis pedidos</h1>
        </div>
        <button
          onClick={() => navigate('/catalog')}
          className="text-sm text-pine-500 hover:text-pine-700 hover:underline"
        >
          ← Catálogo
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-dust-200 p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dust-200">
          <p className="text-gunmetal-400 mb-3">No tienes pedidos aún.</p>
          <button
            onClick={() => navigate('/catalog')}
            className="text-sm font-medium text-pine-500 hover:text-pine-700 hover:underline"
          >
            Hacer mi primer pedido →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="bg-white rounded-xl border border-dust-200 p-5 hover:border-pine-400 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-gunmetal-600 text-gold-300 flex items-center justify-center font-mono text-xs">
                    #{order.id}
                  </div>
                  <div>
                    <p className="font-semibold text-gunmetal-800 font-mono">{order.order_number}</p>
                    <p className="text-xs text-gunmetal-400 mt-0.5">
                      {order.items.length} producto(s) ·{' '}
                      {new Date(order.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                      STATUS_STYLE[order.status]
                    }`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                  <p className="font-bold text-gunmetal-800">
                    ${Number(order.total).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
