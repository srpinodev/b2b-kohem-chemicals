import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

type Role = 'cliente' | 'vendedor' | 'administrador'

const ROLE_LABEL: Record<Role, string> = {
  cliente: 'Cliente',
  vendedor: 'Vendedor',
  administrador: 'Administrador',
}

const ROLE_BLURB: Record<Role, string> = {
  cliente: 'Aquí encontrarás el catálogo de productos, tus pedidos y facturas.',
  vendedor: 'Gestiona pedidos de tus clientes y revisa el catálogo.',
  administrador: 'Panel completo: catálogo, usuarios, pedidos y facturación.',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = (user?.roles[0]?.name ?? 'cliente') as Role

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Welcome banner */}
      <div className="relative bg-gunmetal-600 text-dust-100 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-pine-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gold-400/10 blur-3xl" />

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold-300 mb-2">
              {ROLE_LABEL[role]}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-dust-50">
              Bienvenido, {user?.name}
            </h2>
            <p className="text-sm text-dust-200 mt-2 max-w-xl">
              {ROLE_BLURB[role]}
            </p>
          </div>

          {user?.company && (
            <div className="bg-gunmetal-700/60 border border-gunmetal-500 rounded-xl p-4 min-w-[220px]">
              <p className="text-[10px] uppercase tracking-wider text-gold-300 mb-1">Empresa</p>
              <p className="font-semibold text-dust-50">{user.company.name}</p>
              <p className="text-xs text-dust-300 mt-0.5">NIT: {user.company.nit}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-3">Accesos rápidos</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashCard
          icon={<CatalogIcon />}
          title="Catálogo"
          desc="Productos químicos disponibles"
          onClick={() => navigate('/catalog')}
        />
        <DashCard
          icon={<OrderIcon />}
          title="Pedidos"
          desc="Historial y estado de pedidos"
          onClick={() => navigate('/orders')}
        />
        <DashCard
          icon={<InvoiceIcon />}
          title="Facturas"
          desc="Descarga documentos contables"
          onClick={() => navigate('/invoices')}
        />
      </div>

      {(role === 'administrador' || role === 'vendedor') && (
        <>
          <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-3 mt-8">Administración</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DashCard
              icon={<ProductsIcon />}
              title="Productos"
              desc="Crear, editar y eliminar productos"
              onClick={() => navigate('/admin/products')}
            />
            {role === 'administrador' && (
              <DashCard
                icon={<UsersIcon />}
                title="Usuarios"
                desc="Crear, desactivar y reset password"
                onClick={() => navigate('/admin/users')}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function DashCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left p-5 rounded-xl border border-dust-200 bg-white hover:border-pine-400 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-pine-100 text-pine-600 flex items-center justify-center mb-3 group-hover:bg-gold-400 group-hover:text-gunmetal-800 transition-colors">
        {icon}
      </div>
      <p className="font-semibold text-gunmetal-800">{title}</p>
      <p className="text-sm text-gunmetal-400 mt-1">{desc}</p>
    </button>
  )
}

function CatalogIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function OrderIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function InvoiceIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ProductsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
