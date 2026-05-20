import { Link, useNavigate } from 'react-router-dom'
import ChatWidget from '../chat/ChatWidget'
import NotificationBell from '../notifications/NotificationBell'
import { useAuthStore } from '../../store/authStore'
import { logout as logoutApi } from '../../services/api/auth'
import { useCartStore } from '../../store/cartStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)
  const totalItems = useCartStore((s) => s.totalItems())
  const isAdmin = user?.roles.some((r) => ['administrador', 'vendedor'].includes(r.name))

  const handleLogout = async () => {
    try { await logoutApi() } catch { /* ignore */ }
    logoutStore()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/catalog" className="font-bold text-blue-700 text-base">Kohem Chemicals</Link>
            <Link to="/catalog" className="text-sm text-gray-600 hover:text-blue-700">Catálogo</Link>
            <Link to="/orders" className="text-sm text-gray-600 hover:text-blue-700">Pedidos</Link>
            <Link to="/invoices" className="text-sm text-gray-600 hover:text-blue-700">Facturas</Link>
            {isAdmin && <Link to="/admin" className="text-sm text-gray-600 hover:text-blue-700">Admin</Link>}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition" aria-label="Carrito">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-700 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            <NotificationBell />

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="hidden sm:block">{user?.name}</span>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-600 transition">
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <ChatWidget />
    </div>
  )
}
