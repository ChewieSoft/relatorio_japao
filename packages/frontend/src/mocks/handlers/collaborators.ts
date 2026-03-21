/**
 * Handler MSW para endpoint de colaboradores.
 *
 * Simula GET /api/collaborators/ com paginação server-side
 * no formato DRF PageNumberPagination (20 itens/página).
 */
import { http, HttpResponse } from 'msw'
import { collaborators } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const PAGE_SIZE = 20

export const collaboratorsHandlers = [
  /** Retorna lista paginada de colaboradores. */
  http.get(`${BASE}/collaborators/`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = collaborators.slice(start, end)

    return HttpResponse.json({
      count: collaborators.length,
      next: end < collaborators.length ? `${BASE}/collaborators/?page=${page + 1}` : null,
      previous: page > 1 ? `${BASE}/collaborators/?page=${page - 1}` : null,
      results,
    })
  }),
]
