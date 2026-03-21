/**
 * Hook React Query para listar colaboradores paginados.
 *
 * Busca dados de GET /api/collaborators/?page={page} e transforma
 * campos snake_case da API para camelCase do frontend.
 *
 * @param page - Número da página (default: 1).
 * @returns Resultado da query com dados paginados de colaboradores.
 */
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import type { PaginatedResponse } from '../types/api'
import type { Collaborator } from '../types/entities'

export function useCollaborators(page = 1) {
  return useQuery({
    queryKey: ['collaborators', page],
    queryFn: async (): Promise<PaginatedResponse<Collaborator>> => {
      const res = await api.get(`/collaborators/?page=${page}`)
      return {
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
        results: res.data.results.map((c: Record<string, unknown>) => ({
          id: c.id,
          name: c.name,
          domainUser: c.domain_user,
          department: c.department,
          status: c.status,
          fired: c.fired,
          hasServerAccess: c.has_server_access,
          hasErpAccess: c.has_erp_access,
          hasInternetAccess: c.has_internet_access,
          hasCellphone: c.has_cellphone,
          email: c.email,
        })),
      }
    },
  })
}
