import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProductBySku } from '../../services/api/catalog'
import { useCartStore } from '../../store/cartStore'
import type { Product } from '../../types'

export default function ProductDetailPage() {
  const { sku } = useParams<{ sku: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!sku) return
    getProductBySku(sku)
      .then(({ data }) => setProduct(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [sku])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>
  if (notFound || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">Producto no encontrado.</p>
      <button onClick={() => navigate('/catalog')} className="text-blue-600 hover:underline text-sm">← Volver al catálogo</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/catalog')} className="text-sm text-blue-600 hover:underline mb-6 block">
          ← Volver al catálogo
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-mono text-gray-400 mb-1">{product.sku}</p>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{product.category?.name}</p>
            </div>
            {product.requires_special_handling && (
              <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">⚠ Manejo especial requerido</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoRow label="Número CAS" value={product.cas_number ?? '—'} />
            <InfoRow label="Unidad de venta" value={product.unit} />
            <InfoRow label="Stock disponible" value={`${product.stock} ${product.unit}`} />
            <InfoRow
              label="Precio"
              value={`$${Number(product.price).toLocaleString('es-CO')} / ${product.unit}`}
              highlight
            />
          </div>

          {product.description && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.sds_url && (
            <a
              href={`/storage/${product.sds_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              📄 Descargar Hoja de Seguridad (SDS)
            </a>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm text-gray-600">Cantidad:</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100">−</button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100">+</button>
              </div>
            </div>
            <button
              disabled={product.stock === 0}
              onClick={() => { addItem(product, qty); setAdded(true); setTimeout(() => setAdded(false), 2000) }}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {product.stock === 0 ? 'Producto agotado' : added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
            </button>
            {added && (
              <button onClick={() => navigate('/cart')} className="w-full mt-2 text-sm text-blue-600 hover:underline">
                Ver carrito →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-blue-700 text-base' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}
