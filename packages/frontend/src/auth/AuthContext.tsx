/**
 * Context de autenticação JWT.
 *
 * Gerencia tokens (access/refresh) em localStorage e fornece
 * estado de usuário logado para toda a aplicação.
 * Login valida credenciais contra POST /api/auth/login/,
 * logout invalida refresh token via POST /api/auth/logout/.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../api/client'
import type { User } from '../types/entities'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Provider de autenticação JWT para a aplicação.
 *
 * Verifica token existente no mount e expõe funções login/logout.
 *
 * @param props.children - Componentes filhos que terão acesso ao contexto.
 * @returns Provider com estado de autenticação.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me/', { signal: controller.signal })
        .then(res => {
          setUser({
            id: res.data.id,
            username: res.data.username,
            email: res.data.email,
            isStaff: res.data.is_staff,
          })
        })
        .catch((err) => {
          if (err.name === 'CanceledError') return
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => controller.abort()
  }, [])

  /**
   * Autentica usuário com credenciais e armazena tokens JWT.
   *
   * Tokens só são persistidos em localStorage após confirmação
   * do perfil via /auth/me/. Se o fetch do perfil falhar, os
   * tokens são descartados para evitar estado half-authenticated.
   *
   * @param username - Nome de usuário.
   * @param password - Senha do usuário.
   * @throws Error se credenciais forem inválidas ou perfil indisponível.
   */
  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login/', { username, password })
    const { access, refresh } = res.data

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)

    try {
      const userRes = await api.get('/auth/me/')
      setUser({
        id: userRes.data.id,
        username: userRes.data.username,
        email: userRes.data.email,
        isStaff: userRes.data.is_staff,
      })
    } catch (err) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      throw err
    }
  }

  /** Encerra sessão, invalida refresh token e limpa localStorage. */
  const logout = () => {
    const refresh = localStorage.getItem('refresh_token')
    api.post('/auth/logout/', { refresh }).catch((err) => {
      console.warn('Falha ao invalidar refresh token na API', err)
    })
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para acessar o contexto de autenticação.
 *
 * @returns Objeto com user, loading, login e logout.
 * @throws Error se usado fora de AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
