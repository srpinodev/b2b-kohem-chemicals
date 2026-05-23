import { NavLink, Link, useNavigate } from 'react-router-dom'
import ChatWidget from '../chat/ChatWidget'
import NotificationBell from '../notifications/NotificationBell'
import { useAuthStore } from '../../store/authStore'
import { logout as logoutApi } from '../../services/api/auth'
import { useCartStore } from '../../store/cartStore'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
    isActive
      ? 'text-gold-400 bg-gunmetal-700/80'
      : 'text-dust-200 hover:text-gold-300 hover:bg-gunmetal-700/50',
  ].join(' ')

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)
  const totalItems = useCartStore((s) => s.totalItems())
  const isAdmin = user?.roles.some((r) => ['administrador', 'vendedor'].includes(r.name))
  const role = user?.roles[0]?.name

  const roleLabel: Record<string, string> = {
    cliente: 'Cliente',
    vendedor: 'Vendedor',
    administrador: 'Administrador',
  }

  const handleLogout = async () => {
    try { await logoutApi() } catch { /* ignore */ }
    logoutStore()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-gunmetal-800">
      <nav className="bg-gunmetal-600 text-dust-100 sticky top-0 z-40 shadow-sm border-b border-gunmetal-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/catalog" className="flex items-center gap-2 group">
              <span className="w-8 h-8 rounded-md bg-gold-400 text-gunmetal-800 font-bold flex items-center justify-center text-sm">
                K
              </span>
              <span className="font-semibold tracking-tight text-base text-dust-50 group-hover:text-gold-300 transition-colors">
                Kohem <span className="text-gold-400">Chemicals</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/catalog" className={navLinkClass}>Catálogo</NavLink>
              <NavLink to="/orders" className={navLinkClass}>Pedidos</NavLink>
              <NavLink to="/invoices" className={navLinkClass}>Facturas</NavLink>
              {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-gunmetal-700 transition"
              aria-label="Carrito"
            >
              <svg className="w-5 h-5 text-dust-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gold-400 text-gunmetal-800 text-[10px] rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            <NotificationBell />

            <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-gunmetal-500">
              <div className="text-right leading-tight">
                <p className="text-sm text-dust-50">{user?.name}</p>
                {role && (
                  <p className="text-[10px] uppercase tracking-wider text-gold-300">
                    {roleLabel[role] ?? role}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-dust-300 hover:text-gold-300 px-2 py-1 rounded transition"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-dust-200 bg-surface-muted text-gunmetal-400 text-xs">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Kohem Chemicals · Plataforma B2B</span>
          <span className="hidden sm:inline">Hecho con cuidado para profesionales de la industria química.</span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}
