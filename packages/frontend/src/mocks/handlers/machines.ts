/**
 * Handler MSW para endpoint de máquinas.
 *
 * Simula GET /api/machines/ com paginação server-side
 * no formato DRF PageNumberPagination (20 itens/página).
 */
import { http, HttpResponse } from 'msw'
import { machines } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const PAGE_SIZE = 20

export const machinesHandlers = [
  /** Retorna lista paginada de máquinas. */
  http.get(`${BASE}/machines/`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = machines.slice(start, end)

    return HttpResponse.json({
      count: machines.length,
      next: end < machines.length ? `${BASE}/machines/?page=${page + 1}` : null,
      previous: page > 1 ? `${BASE}/machines/?page=${page - 1}` : null,
      results,
    })
  }),
]
