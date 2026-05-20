import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  token: string | null
  twoFaVerified: boolean
  setAuth: (user: User, token: string) => void
  setTwoFaVerified: (verified: boolean) => void
  updateUser: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      twoFaVerified: false,

      setAuth: (user, token) => set({ user, token, twoFaVerified: false }),

      setTwoFaVerified: (verified) => set({ twoFaVerified: verified }),

      updateUser: (user) => set({ user }),

      logout: () => set({ user: null, token: null, twoFaVerified: false }),

      isAuthenticated: () => {
        const { token, user } = get()
        return !!token && !!user
      },

      hasRole: (role) => {
        const { user } = get()
        return user?.roles?.some((r) => r.name === role) ?? false
      },
    }),
    {
      name: 'kohem-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
