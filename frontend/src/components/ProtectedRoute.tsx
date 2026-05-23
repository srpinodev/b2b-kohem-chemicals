import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { RoleName } from '../types'

interface Props {
  children: React.ReactNode
  roles?: RoleName[]
}

// Cuentas demo: omitidas del setup obligatorio para no romper el flujo de evaluación.
const DEMO_EMAILS = new Set([
  'admin@kohem.co',
  'vendedor@kohem.co',
  'cliente@demo.co',
  'cliente2@demo.co',
  'distribuidor@demo.co',
])

export default function ProtectedRoute({ children, roles }: Props) {
  const { token, user, twoFaVerified } = useAuthStore()

  if (!token || !user) return <Navigate to="/login" replace />

  const isDemo = DEMO_EMAILS.has(user.email.toLowerCase())

  // Política: usuarios productivos deben tener 2FA configurado antes de operar.
  if (!isDemo && !user.two_factor_enabled) {
    return <Navigate to="/auth/2fa-setup" replace />
  }

  if (user.two_factor_enabled && !twoFaVerified) {
    return <Navigate to="/auth/2fa" replace />
  }

  if (roles && !user.roles.some((r) => roles.includes(r.name as RoleName))) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
