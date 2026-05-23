import { cloneElement, useCallback, useEffect, useId, useState, type ReactElement } from 'react'
import {
  createAdminUser,
  deactivateAdminUser,
  listAdminUsers,
  resetUser2fa,
  resetUserPassword,
  type PaginatedUsers,
} from '../../services/api/admin'
import { useAuthStore } from '../../store/authStore'
import { useDebounce } from '../../hooks/useDebounce'

type RoleFilter = '' | 'cliente' | 'vendedor' | 'administrador'

export default function AdminUsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [role, setRole] = useState<RoleFilter>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [tempPasswordModal, setTempPasswordModal] = useState<{ name: string; password: string } | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<number | null>(null)
  const [pendingReset2fa, setPendingReset2fa] = useState<number | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    try {
      const { data } = await listAdminUsers({
        search: debouncedSearch || undefined,
        role: role || undefined,
        page,
        per_page: 15,
      })
      setData(data)
      setError('')
    } catch {
      setError('No se pudo cargar la lista de usuarios.')
    }
  }, [debouncedSearch, role, page])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const handleDeactivate = async (id: number) => {
    setActionLoadingId(id)
    try {
      await deactivateAdminUser(id)
      setPendingDeactivate(null)
      await refresh()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No se pudo desactivar el usuario.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReset = async (id: number, name: string) => {
    setActionLoadingId(id)
    try {
      const { data } = await resetUserPassword(id)
      setTempPasswordModal({ name, password: data.temporary_password })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No se pudo resetear la contraseña.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReset2fa = async (id: number) => {
    setActionLoadingId(id)
    try {
      await resetUser2fa(id)
      setPendingReset2fa(null)
      await refresh()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No se pudo resetear el 2FA.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-1">Administración</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gunmetal-800">Usuarios</h1>
          <p className="text-sm text-gunmetal-400 mt-1">
            {data ? `${data.total} usuario(s)` : 'Cargando...'}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-gunmetal-800 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white border border-dust-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nombre o correo..."
          className="flex-1 bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value as RoleFilter); setPage(1) }}
          className="bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition min-w-[180px]"
        >
          <option value="">Todos los roles</option>
          <option value="cliente">Cliente</option>
          <option value="vendedor">Vendedor</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-dust-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dust-100 border-b border-dust-200">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Usuario</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Rol</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Empresa</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dust-200">
              {loading && (!data || data.data.length === 0) ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-dust-100 rounded" /></td></tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gunmetal-400">Sin usuarios.</td></tr>
              ) : (
                data?.data.map((u) => {
                  const userRole = u.roles[0]?.name
                  const isAdminRow = userRole === 'administrador'
                  const isSelf = u.id === currentUserId
                  return (
                    <tr key={u.id} className={!u.is_active ? 'opacity-60' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gunmetal-800">{u.name}</p>
                        <p className="text-xs text-gunmetal-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={userRole} />
                      </td>
                      <td className="px-4 py-3 text-gunmetal-700">{u.company?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.is_active ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-pine-100 text-pine-700 border-pine-200">Activo</span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-dust-200 text-gunmetal-700 border-dust-300">Inactivo</span>
                          )}
                          {u.two_factor_enabled && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-gold-100 text-gold-700 border-gold-200" title="Autenticación 2FA activada">
                              2FA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleReset(u.id, u.name)}
                          disabled={isSelf || actionLoadingId === u.id}
                          title={isSelf ? 'No puedes resetear tu propia contraseña' : 'Generar contraseña temporal'}
                          className="text-pine-500 hover:text-pine-700 text-xs font-semibold mr-3 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Reset password
                        </button>
                        {pendingReset2fa === u.id ? (
                          <span className="inline-flex items-center gap-2 mr-3">
                            <button
                              onClick={() => handleReset2fa(u.id)}
                              disabled={actionLoadingId === u.id}
                              className="text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-50"
                            >
                              {actionLoadingId === u.id ? 'Reseteando…' : 'Confirmar reset 2FA'}
                            </button>
                            <button
                              onClick={() => setPendingReset2fa(null)}
                              className="text-gunmetal-400 hover:text-gunmetal-700 text-xs"
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setPendingReset2fa(u.id)}
                            disabled={isSelf || !u.two_factor_enabled}
                            title={isSelf ? 'No puedes resetear tu propio 2FA' : !u.two_factor_enabled ? 'El usuario no tiene 2FA configurado' : 'Forzar reconfiguración de 2FA en el próximo login'}
                            className="text-pine-500 hover:text-pine-700 text-xs font-semibold mr-3 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Reset 2FA
                          </button>
                        )}
                        {pendingDeactivate === u.id ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleDeactivate(u.id)}
                              disabled={actionLoadingId === u.id}
                              className="text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-50"
                            >
                              {actionLoadingId === u.id ? 'Eliminando…' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setPendingDeactivate(null)}
                              className="text-gunmetal-400 hover:text-gunmetal-700 text-xs"
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setPendingDeactivate(u.id)}
                            disabled={isSelf || isAdminRow || !u.is_active}
                            title={isAdminRow ? 'No se permite desactivar administradores' : isSelf ? 'No puedes desactivar tu propio usuario' : !u.is_active ? 'Ya está inactivo' : 'Desactivar'}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
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

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); refresh() }}
        />
      )}

      {tempPasswordModal && (
        <TempPasswordModal
          userName={tempPasswordModal.name}
          password={tempPasswordModal.password}
          onClose={() => setTempPasswordModal(null)}
        />
      )}
    </div>
  )
}

function RoleBadge({ role }: { role?: string }) {
  if (role === 'administrador') return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-gold-100 text-gold-700 border-gold-200">Administrador</span>
  if (role === 'vendedor') return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-pine-100 text-pine-700 border-pine-200">Vendedor</span>
  return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold border bg-dust-200 text-gunmetal-700 border-dust-300">Cliente</span>
}

interface CreateUserModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cliente' as 'cliente' | 'vendedor',
    company_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSaving(true)
    try {
      await createAdminUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        company_id: form.company_id ? Number(form.company_id) : null,
      })
      onCreated()
    } catch (err: unknown) {
      const r = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      setFieldErrors(r?.errors ?? {})
      setError(r?.message ?? 'No se pudo crear el usuario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gunmetal-800/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-dust-200 flex items-center justify-between">
          <h2 className="font-bold text-gunmetal-800">Nuevo usuario</h2>
          <button onClick={onClose} className="text-gunmetal-400 hover:text-gunmetal-700 w-7 h-7 flex items-center justify-center rounded">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}

          <ModalField label="Nombre" required error={fieldErrors.name?.[0]}>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </ModalField>

          <ModalField label="Correo" required error={fieldErrors.email?.[0]}>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </ModalField>

          <ModalField label="Contraseña" required error={fieldErrors.password?.[0]}>
            <input
              type="text"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm font-mono text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            />
          </ModalField>

          <ModalField label="Rol" required error={fieldErrors.role?.[0]}>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'cliente' | 'vendedor' })}
              className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
            >
              <option value="cliente">Cliente</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </ModalField>

          {form.role === 'cliente' && (
            <ModalField label="ID de empresa" error={fieldErrors.company_id?.[0]}>
              <input
                type="number"
                value={form.company_id}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                placeholder="Opcional"
                className="w-full bg-dust-50 border border-dust-300 rounded-lg px-3 py-2 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 focus:bg-white transition"
              />
            </ModalField>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-dust-300 rounded-lg text-gunmetal-700 hover:bg-dust-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gold-400 hover:bg-gold-500 text-gunmetal-800 rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-60"
            >
              {saving ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactElement<{ id?: string }>
}) {
  const generatedId = useId()
  const inputId = children.props.id ?? generatedId
  const labelled = cloneElement(children, { id: inputId })
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gunmetal-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {labelled}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function TempPasswordModal({
  userName,
  password,
  onClose,
}: {
  userName: string
  password: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gunmetal-800/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-dust-200">
          <h2 className="font-bold text-gunmetal-800">Contraseña restablecida</h2>
          <p className="text-xs text-gunmetal-400 mt-0.5">para {userName}</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gunmetal-600">
            Comparte esta contraseña temporal con el usuario por un canal seguro. <strong>No podrás verla de nuevo</strong>.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={password}
              className="flex-1 bg-dust-100 border border-dust-300 rounded-lg px-3 py-2 text-sm font-mono text-gunmetal-800 select-all"
            />
            <button
              onClick={copy}
              className="px-3 py-2 bg-gunmetal-600 hover:bg-gunmetal-700 text-dust-50 rounded-lg text-sm font-medium transition whitespace-nowrap"
            >
              {copied ? '✓ Copiada' : 'Copiar'}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gold-400 hover:bg-gold-500 text-gunmetal-800 rounded-lg text-sm font-semibold transition shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
