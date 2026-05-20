import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { RoleName } from '../types'

interface Props {
  children: React.ReactNode
  roles?: RoleName[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { token, user, twoFaVerified } = useAuthStore()

  if (!token || !user) return <Navigate to="/login" replace />

  if (user.two_factor_enabled && !twoFaVerified) {
    return <Navigate to="/auth/2fa" replace />
  }

  if (roles && !user.roles.some((r) => roles.includes(r.name as RoleName))) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
