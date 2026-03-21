/**
 * Hook React Query para listar software paginado.
 *
 * Busca dados de GET /api/software/?page={page} e transforma
 * campos snake_case da API para camelCase do frontend.
 *
 * @param page - Número da página (default: 1).
 * @returns Resultado da query com dados paginados de software.
 */
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import type { PaginatedResponse } from '../types/api'
import type { Software } from '../types/entities'

export function useSoftware(page = 1) {
  return useQuery({
    queryKey: ['software', page],
    queryFn: async (): Promise<PaginatedResponse<Software>> => {
      const res = await api.get(`/software/?page=${page}`)
      return {
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
        results: res.data.results.map((s: Record<string, unknown>) => ({
          id: s.id,
          softwareName: s.software_name,
          licenseKey: s.license_key,
          licenseType: s.license_type,
          quantity: s.quantity,
          inUse: s.in_use,
          expiresAt: s.expires_at,
        })),
      }
    },
  })
}
