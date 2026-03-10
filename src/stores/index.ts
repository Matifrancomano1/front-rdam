import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (user: AuthUser) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('rdam_access_token', accessToken)
        localStorage.setItem('rdam_refresh_token', refreshToken)
        set({ user, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('rdam_access_token')
        localStorage.removeItem('rdam_refresh_token')
        set({ user: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'rdam_user',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)

// ── Sede store ────────────────────────────────
type SedeType = 'Todas' | 'Santa Fe' | 'Rosario' | 'Venado Tuerto' | 'Rafaela' | 'Reconquista'

interface SedeState {
  sede: SedeType
  setSede: (s: SedeType) => void
}

export const useSedeStore = create<SedeState>()(
  persist(
    (set) => ({
      sede: 'Todas',
      setSede: (sede) => set({ sede }),
    }),
    { name: 'rdam_sede' }
  )
)
