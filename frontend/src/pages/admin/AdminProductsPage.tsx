import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  deleteAdminProduct,
  listAdminProducts,
  type PaginatedProducts,
} from '../../services/api/admin'
import { usePolling } from '../../hooks/usePolling'
import { useDebounce } from '../../hooks/useDebounce'
import { getCategories } from '../../services/api/catalog'
import type { Category } from '../../types'

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<PaginatedProducts | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const { data } = await listAdminProducts({
        search: debouncedSearch || undefined,
        category_id: categoryId,
        page,
        per_page: 15,
      })
      setData(data)
      setError('')
    } catch {
      setError('No se pudo cargar el listado de productos.')
    }
  }, [debouncedSearch, categoryId, page])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data)).catch(() => { /* sin bloqueo */ })
  }, [])

  usePolling(refresh, { intervalMs: 20_000 })

  const handleDelete = async (id: number) => {
    setDeleting(id)
    try {
      await deleteAdminProduct(id)
      setPendingDelete(null)
      await refresh()
    } catch {
      setError('No se pudo eliminar el producto.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-1">Administración</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gunmetal-800">Productos</h1>
          <p className="text-sm text-gunmetal-400 mt-1">
            {data ? `${data.total} producto(s) en el catálogo` : 'Cargando...'}
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-gunmetal-800 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo producto
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white border border-dust-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por SKU, nombre o CAS..."
          className="flex-1 bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
        />
        <select
          value={categoryId ?? ''}
          onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
          className="bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition min-w-[180px]"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-dust-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dust-100 border-b border-dust-200">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">SKU</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Producto</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Categoría</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500 text-right">Precio</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500 text-right">Stock</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dust-200">
              {loading && (!data || data.data.length === 0) ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-dust-100 rounded" />
                    </td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gunmetal-400">Sin productos.</td></tr>
              ) : (
                data?.data.map((p) => (
                  <tr key={p.id} className={!p.is_active ? 'opacity-60' : ''}>
                    <td className="px-4 py-3 font-mono text-xs text-gunmetal-600">{p.sku}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gunmetal-800">{p.name}</p>
                      {p.cas_number && (
                        <p className="text-xs text-gunmetal-400 font-mono">CAS: {p.cas_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gunmetal-700">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gunmetal-800">
                      ${Number(p.price).toLocaleString('es-CO')}
                      <span className="text-xs font-normal text-gunmetal-400 ml-1">/{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.stock > 0 ? 'text-pine-600 font-medium' : 'text-red-600 font-medium'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.is_active ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-pine-100 text-pine-700 border-pine-200">Activo</span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-dust-200 text-gunmetal-700 border-dust-300">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/products/${p.sku}/edit`)}
                        className="text-pine-500 hover:text-pine-700 text-xs font-semibold mr-3"
                      >
                        Editar
                      </button>
                      {pendingDelete === p.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-50"
                          >
                            {deleting === p.id ? 'Eliminando…' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="text-gunmetal-400 hover:text-gunmetal-700 text-xs"
                          >
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setPendingDelete(p.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1.5 text-sm border border-dust-300 rounded-lg text-gunmetal-700 hover:bg-dust-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1 text-sm text-gunmetal-500">
            Página <span className="font-semibold text-gunmetal-800">{page}</span> de {data.last_page}
          </span>
          <button
            disabled={page === data.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1.5 text-sm border border-dust-300 rounded-lg text-gunmetal-700 hover:bg-dust-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
