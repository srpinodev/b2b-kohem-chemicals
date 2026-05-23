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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-dust-200 p-8 animate-pulse">
          <div className="h-3 w-20 bg-dust-200 rounded mb-3" />
          <div className="h-7 w-2/3 bg-dust-200 rounded mb-2" />
          <div className="h-4 w-1/3 bg-dust-200 rounded mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-dust-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-gunmetal-500">Producto no encontrado.</p>
      <button
        onClick={() => navigate('/catalog')}
        className="text-pine-500 hover:text-pine-700 hover:underline text-sm font-medium"
      >
        ← Volver al catálogo
      </button>
    </div>
  )

  const totalPrice = Number(product.price) * qty

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate('/catalog')}
        className="text-sm text-pine-500 hover:text-pine-700 hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Volver al catálogo
      </button>

      <div className="bg-white rounded-2xl border border-dust-200 shadow-sm overflow-hidden">
        <div className="bg-gunmetal-600 text-dust-100 px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-gold-300 mb-1">{product.sku}</p>
              <h1 className="text-2xl font-bold text-dust-50">{product.name}</h1>
              <p className="text-sm uppercase tracking-wider text-gold-300 mt-1">
                {product.category?.name}
              </p>
            </div>
            {product.requires_special_handling && (
              <span className="bg-gold-400 text-gunmetal-800 text-xs px-3 py-1.5 rounded-full font-semibold flex-shrink-0">
                ⚠ Manejo especial
              </span>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoRow label="Número CAS" value={product.cas_number ?? '—'} mono />
            <InfoRow label="Unidad de venta" value={product.unit} />
            <InfoRow label="Stock disponible" value={`${product.stock} ${product.unit}`} />
            <InfoRow
              label="Precio unitario"
              value={`$${Number(product.price).toLocaleString('es-CO')}`}
              highlight
            />
          </div>

          {product.description && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-semibold text-pine-500 mb-2">Descripción</p>
              <p className="text-sm text-gunmetal-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.sds_url && (
            <a
              href={`/storage/${product.sds_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-pine-500 hover:text-pine-700 hover:underline mb-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar Hoja de Seguridad (SDS)
            </a>
          )}

          <div className="pt-6 border-t border-dust-200">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gunmetal-700">Cantidad:</label>
                <div className="inline-flex items-center bg-dust-50 border border-dust-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 text-gunmetal-600 hover:bg-dust-200 transition disabled:opacity-40"
                    disabled={qty <= 1}
                    aria-label="Disminuir"
                  >−</button>
                  <span className="w-12 text-center font-medium text-gunmetal-800">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-9 h-9 text-gunmetal-600 hover:bg-dust-200 transition disabled:opacity-40"
                    disabled={qty >= product.stock}
                    aria-label="Aumentar"
                  >+</button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gunmetal-400">Subtotal (sin IVA)</p>
                <p className="text-xl font-bold text-gunmetal-800">
                  ${totalPrice.toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            <button
              disabled={product.stock === 0}
              onClick={() => { addItem(product, qty); setAdded(true); setTimeout(() => setAdded(false), 2000) }}
              className="w-full bg-gold-400 hover:bg-gold-500 disabled:bg-dust-200 disabled:text-gunmetal-400 disabled:cursor-not-allowed text-gunmetal-800 font-semibold py-3 rounded-xl transition-colors shadow-sm"
            >
              {product.stock === 0 ? 'Producto agotado' : added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
            </button>

            {added && (
              <button
                onClick={() => navigate('/cart')}
                className="w-full mt-3 text-sm text-pine-500 hover:text-pine-700 hover:underline"
              >
                Ver carrito →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className={`rounded-lg p-3 border ${highlight ? 'bg-pine-50 border-pine-200' : 'bg-dust-50 border-dust-200'}`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-gunmetal-400 mb-1">
        {label}
      </p>
      <p
        className={[
          'text-sm font-semibold',
          mono ? 'font-mono' : '',
          highlight ? 'text-pine-700 text-base' : 'text-gunmetal-800',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}
