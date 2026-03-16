import axios, { type AxiosRequestConfig } from 'axios'

const BASE = '/v1'

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// ── Attach token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rdam_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── 401 → refresh ────────────────────────────
let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true
      const refreshToken = localStorage.getItem('rdam_refresh_token')

      if (!refreshToken) {
        clearSession()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken })
        const newToken: string = data.data.accessToken
        localStorage.setItem('rdam_access_token', newToken)
        queue.forEach((cb) => cb(newToken))
        queue = []
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        clearSession()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

function clearSession() {
  localStorage.removeItem('rdam_access_token')
  localStorage.removeItem('rdam_refresh_token')
  localStorage.removeItem('rdam_user')
}

// ── Public instance (no auth, no refresh) ────
export const publicApi = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})
