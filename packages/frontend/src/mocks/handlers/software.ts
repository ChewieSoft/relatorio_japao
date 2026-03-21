/**
 * Handler MSW para endpoint de software.
 *
 * Simula GET /api/software/ com paginação server-side
 * no formato DRF PageNumberPagination (20 itens/página).
 */
import { http, HttpResponse } from 'msw'
import { software } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const PAGE_SIZE = 20

export const softwareHandlers = [
  /** Retorna lista paginada de software. */
  http.get(`${BASE}/software/`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = software.slice(start, end)

    return HttpResponse.json({
      count: software.length,
      next: end < software.length ? `${BASE}/software/?page=${page + 1}` : null,
      previous: page > 1 ? `${BASE}/software/?page=${page - 1}` : null,
      results,
    })
  }),
]
