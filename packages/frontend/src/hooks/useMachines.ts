/**
 * Hook React Query para listar máquinas paginadas.
 *
 * Busca dados de GET /api/machines/?page={page} e transforma
 * campos snake_case da API para camelCase do frontend.
 *
 * @param page - Número da página (default: 1).
 * @returns Resultado da query com dados paginados de máquinas.
 */
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import type { PaginatedResponse } from '../types/api'
import type { Machine } from '../types/entities'

export function useMachines(page = 1) {
  return useQuery({
    queryKey: ['machines', page],
    queryFn: async (): Promise<PaginatedResponse<Machine>> => {
      const res = await api.get(`/machines/?page=${page}`)
      return {
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
        results: res.data.results.map((m: Record<string, unknown>) => ({
          id: m.id,
          hostname: m.hostname,
          model: m.model,
          serviceTag: m.service_tag,
          ip: m.ip,
          macAddress: m.mac_address,
          operationalSystem: m.operational_system,
          encrypted: m.encrypted,
          antivirus: m.antivirus,
          collaboratorId: m.collaborator_id,
          collaboratorName: m.collaborator_name,
          machineType: m.machine_type,
        })),
      }
    },
  })
}
