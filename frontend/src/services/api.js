import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
})

// Inject JWT token
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// Handle 401 — auto refresh or redirect
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const auth = useAuthStore()
    const original = err.config

    if (err.response?.status === 401 && !original._retry && auth.refreshToken) {
      original._retry = true
      try {
        await auth.refreshAccessToken()
        original.headers.Authorization = `Bearer ${auth.token}`
        return api(original)
      } catch {
        auth.logout()
        router.push('/tr/login')
      }
    }

    return Promise.reject(err)
  }
)

export default api
