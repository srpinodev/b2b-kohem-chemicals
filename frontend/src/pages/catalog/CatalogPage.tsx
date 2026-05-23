import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCategories, getProducts } from '../../services/api/catalog'
import type { PaginatedProducts } from '../../services/api/catalog'
import type { Category } from '../../types'

export default function CatalogPage() {
  const navigate = useNavigate()

  const [catalog, setCatalog] = useState<PaginatedProducts | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data)).catch(() => { /* fallback al string vacío */ })
  }, [])

  async function fetchCatalog() {
    setLoading(true)
    try {
      const { data } = await getProducts({
        search: search || undefined,
        category_id: categoryId,
        page,
        per_page: 12,
      })
      setCatalog(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCatalog() }, [search, categoryId, page])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPage(1)
    fetchCatalog()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-1">
              Catálogo
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gunmetal-800">
              Productos químicos
            </h1>
            <p className="text-sm text-gunmetal-400 mt-1">
              {catalog ? `${catalog.total} producto(s) disponibles` : 'Explora nuestro inventario'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-dust-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gunmetal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre, SKU o número CAS..."
              className="w-full bg-dust-50 border border-dust-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </div>
        </form>
        <select
          value={categoryId ?? ''}
          onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
          className="bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition min-w-[200px]"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-dust-200 p-5 animate-pulse">
              <div className="h-3 w-20 bg-dust-200 rounded mb-3" />
              <div className="h-5 w-3/4 bg-dust-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-dust-200 rounded mb-6" />
              <div className="h-6 w-24 bg-dust-200 rounded" />
            </div>
          ))}
        </div>
      ) : catalog?.data.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dust-200">
          <p className="text-gunmetal-400">No se encontraron productos.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog?.data.map((product) => (
              <article
                key={product.id}
                onClick={() => navigate(`/catalog/${product.sku}`)}
                className="group bg-white rounded-xl border border-dust-200 p-5 hover:border-pine-400 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-gunmetal-400 bg-dust-100 px-2 py-0.5 rounded">
                    {product.sku}
                  </span>
                  {product.requires_special_handling && (
                    <span className="text-[10px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-medium border border-gold-200">
                      ⚠ Manejo especial
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gunmetal-800 mb-1 group-hover:text-pine-500 transition-colors">
                  {product.name}
                </h3>

                {product.cas_number && (
                  <p className="text-xs text-gunmetal-400 mb-1">
                    CAS: <span className="font-mono">{product.cas_number}</span>
                  </p>
                )}
                <p className="text-xs uppercase tracking-wider text-pine-500 font-medium mb-4">
                  {product.category?.name}
                </p>

                <div className="mt-auto pt-3 border-t border-dust-200 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gunmetal-400">Desde</p>
                    <p className="text-lg font-bold text-gunmetal-800 leading-tight">
                      ${Number(product.price).toLocaleString('es-CO')}
                      <span className="text-xs font-normal text-gunmetal-400 ml-1">/{product.unit}</span>
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-md font-medium ${
                      product.stock > 0
                        ? 'bg-pine-100 text-pine-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} disp.` : 'Agotado'}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {catalog && catalog.last_page > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-1.5 text-sm border border-dust-300 rounded-lg text-gunmetal-700 hover:bg-dust-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gunmetal-500">
                Página <span className="font-semibold text-gunmetal-800">{page}</span> de {catalog.last_page}
              </span>
              <button
                disabled={page === catalog.last_page}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-1.5 text-sm border border-dust-300 rounded-lg text-gunmetal-700 hover:bg-dust-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
