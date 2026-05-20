import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts } from '../../services/api/catalog'
import { useAuthStore } from '../../store/authStore'
import type { PaginatedProducts } from '../../services/api/catalog'

const CATEGORIES = [
  { id: 1, name: 'Ácidos' },
  { id: 2, name: 'Bases' },
  { id: 3, name: 'Solventes' },
  { id: 4, name: 'Oxidantes' },
]

export default function CatalogPage() {
  const navigate = useNavigate()
  const { user, logout: storeLogout } = useAuthStore()

  const [catalog, setCatalog] = useState<PaginatedProducts | null>(null)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  async function fetchCatalog() {
    setLoading(true)
    try {
      const { data } = await getProducts({ search: search || undefined, category_id: categoryId, page, per_page: 12 })
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

  async function handleLogout() {
    storeLogout()
    navigate('/login')
  }

  const role = user?.roles[0]?.name
  const isAdmin = role === 'administrador' || role === 'vendedor'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg text-gray-900">Kohem Chemicals — Catálogo</span>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/products')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Gestionar productos
            </button>
          )}
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">
            Salir
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre, SKU o número CAS..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
          <select
            value={categoryId ?? ''}
            onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando...</div>
        ) : catalog?.data.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No se encontraron productos.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog?.data.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/catalog/${product.sku}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                    {product.requires_special_handling && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⚠ Manejo especial</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  {product.cas_number && (
                    <p className="text-xs text-gray-500 mb-2">CAS: {product.cas_number}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-3">{product.category?.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-700">
                      ${Number(product.price).toLocaleString('es-CO')}
                      <span className="text-xs font-normal text-gray-400">/{product.unit}</span>
                    </span>
                    <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {catalog && catalog.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {page} / {catalog.last_page}
                </span>
                <button
                  disabled={page === catalog.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
