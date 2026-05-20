import { useNavigate } from 'react-router-dom'
import { logout } from '../services/api/auth'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const { user, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()

  const role = user?.roles[0]?.name ?? 'cliente'

  const roleLabel: Record<string, string> = {
    cliente: 'Cliente',
    vendedor: 'Vendedor',
    administrador: 'Administrador',
  }

  const roleColor: Record<string, string> = {
    cliente: 'bg-green-100 text-green-800',
    vendedor: 'bg-blue-100 text-blue-800',
    administrador: 'bg-purple-100 text-purple-800',
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      storeLogout()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg text-gray-900">Kohem Chemicals</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColor[role]}`}>
            {roleLabel[role]}
          </span>
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido, {user?.name}
        </h2>
        <p className="text-gray-500 mb-8">
          {role === 'cliente' && 'Aquí encontrarás el catálogo de productos y tus pedidos.'}
          {role === 'vendedor' && 'Gestiona pedidos de tus clientes y el catálogo.'}
          {role === 'administrador' && 'Panel de administración completo.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashCard title="Catálogo" desc="Ver productos disponibles" onClick={() => navigate('/catalog')} />
          <DashCard title="Pedidos" desc="Próximamente — Sprint 3" disabled />
          <DashCard title="Facturas" desc="Próximamente — Sprint 4" disabled />
        </div>

        {user?.company && (
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
            <p className="text-sm font-medium text-gray-700">Empresa</p>
            <p className="text-lg font-semibold text-gray-900">{user.company.name}</p>
            <p className="text-sm text-gray-500">NIT: {user.company.nit}</p>
          </div>
        )}
      </main>
    </div>
  )
}

function DashCard({ title, desc, disabled, onClick }: { title: string; desc: string; disabled?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border ${disabled ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-blue-400 cursor-pointer'}`}
    >
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  )
}
