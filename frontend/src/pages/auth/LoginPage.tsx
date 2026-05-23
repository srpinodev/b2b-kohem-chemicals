import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/api/auth'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await login(form)
      setAuth(data.user, data.token)

      if (data.requires_2fa) {
        navigate('/auth/2fa')
      } else {
        navigate('/catalog')
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Error al iniciar sesión.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      {/* Branding side */}
      <aside className="hidden lg:flex flex-col justify-between bg-gunmetal-600 text-dust-100 p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-pine-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="w-12 h-12 rounded-lg bg-gold-400 text-gunmetal-800 font-bold flex items-center justify-center text-xl">
            K
          </span>
          <div>
            <p className="text-lg font-semibold text-dust-50">Kohem Chemicals</p>
            <p className="text-xs text-gold-300 tracking-wider uppercase">Plataforma B2B</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold text-dust-50 leading-tight mb-4">
            Tu canal digital para químicos industriales.
          </h2>
          <p className="text-dust-200 text-sm leading-relaxed">
            Cotiza, ordena y haz seguimiento a tus pedidos en un solo lugar.
            Catálogo completo, facturación electrónica y soporte experto.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-dust-200">
            {['Catálogo con SDS y CAS', 'Pedidos y estado en tiempo real', 'Facturación e IVA 19%'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-dust-400">
          © {new Date().getFullYear()} Kohem Chemicals · Colombia
        </p>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-10 h-10 rounded-md bg-gold-400 text-gunmetal-800 font-bold flex items-center justify-center text-base">K</span>
            <span className="font-semibold text-gunmetal-800">Kohem Chemicals</span>
          </div>

          <h1 className="text-2xl font-bold text-gunmetal-800 mb-1">Inicia sesión</h1>
          <p className="text-sm text-gunmetal-400 mb-8">
            Accede a tu cuenta de cliente, distribuidor o vendedor.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gunmetal-700 mb-1.5">
                Correo corporativo
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white border border-dust-300 rounded-lg px-3.5 py-2.5 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 transition"
                placeholder="tu@empresa.co"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gunmetal-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white border border-dust-300 rounded-lg px-3.5 py-2.5 text-sm text-gunmetal-800 placeholder:text-gunmetal-300 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gunmetal-600 hover:bg-gunmetal-700 disabled:opacity-60 disabled:cursor-not-allowed text-dust-50 font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-8 p-3 rounded-lg bg-dust-100 border border-dust-200 text-xs text-gunmetal-500">
            <p className="font-medium text-gunmetal-700 mb-1">Cuentas demo</p>
            <p>admin@kohem.co · vendedor@kohem.co · cliente@demo.co</p>
            <p className="mt-0.5">Contraseña: <span className="font-mono font-semibold text-gunmetal-700">password</span></p>
          </div>
        </div>
      </main>
    </div>
  )
}
