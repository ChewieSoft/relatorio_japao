/**
 * Cliente HTTP Axios com interceptors JWT.
 *
 * Configura base URL via variável de ambiente VITE_API_URL,
 * adiciona token Bearer em todas as requisições autenticadas
 * e renova automaticamente o access token via refresh quando
 * recebe HTTP 401.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

/**
 * Interceptor de request: adiciona Authorization header
 * com token Bearer armazenado em localStorage.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Interceptor de response: renova access token automaticamente
 * quando recebe 401, usando o refresh token. Em caso de falha
 * no refresh, limpa tokens e redireciona para /login.
 *
 * Usa uma Promise compartilhada para evitar múltiplas chamadas
 * de refresh simultâneas quando vários requests falham com 401.
 */
let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refresh = localStorage.getItem('refresh_token')
            if (!refresh) {
              throw new Error('No refresh token')
            }

            const res = await axios.post(
              `${api.defaults.baseURL}/auth/refresh/`,
              { refresh }
            )
            localStorage.setItem('access_token', res.data.access)
            return res.data.access as string
          })().finally(() => {
            refreshPromise = null
          })
        }

        const newToken = await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
