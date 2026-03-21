/**
 * Handlers MSW para endpoints de autenticação JWT.
 *
 * Simula POST /api/auth/login/, POST /api/auth/refresh/,
 * GET /api/auth/me/ e POST /api/auth/logout/.
 * Valida credenciais admin/admin123 em desenvolvimento.
 */
import { http, HttpResponse } from 'msw'
import { mockUser, mockTokens } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const authHandlers = [
  /** Gera par de tokens JWT para credenciais válidas. */
  http.post(`${BASE}/auth/login/`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string }

    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json(mockTokens)
    }

    return HttpResponse.json(
      { detail: 'No active account found with the given credentials' },
      { status: 401 }
    )
  }),

  /** Renova access token a partir de refresh token. */
  http.post(`${BASE}/auth/refresh/`, async () => {
    return HttpResponse.json({ access: 'mock-refreshed-access-token' })
  }),

  /** Retorna dados do usuário autenticado. */
  http.get(`${BASE}/auth/me/`, () => {
    return HttpResponse.json(mockUser)
  }),

  /** Invalida refresh token (logout). */
  http.post(`${BASE}/auth/logout/`, () => {
    return HttpResponse.json({})
  }),
]
