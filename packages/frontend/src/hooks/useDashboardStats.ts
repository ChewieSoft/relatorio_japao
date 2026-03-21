/**
 * Hook React Query para estatísticas do dashboard.
 *
 * Busca dados de GET /api/dashboard/stats/ e transforma
 * campos snake_case da API para camelCase do frontend.
 *
 * @returns Resultado da query com estatísticas consolidadas.
 */
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import type { DashboardStats } from '../types/entities'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await api.get('/dashboard/stats/')
      return {
        activeCollaborators: res.data.active_collaborators,
        totalCollaborators: res.data.total_collaborators,
        totalMachines: res.data.total_machines,
        totalSoftware: res.data.total_software,
        pendingReports: res.data.pending_reports,
        totalReports: res.data.total_reports,
        machinesWithoutEncryption: res.data.machines_without_encryption,
      }
    },
  })
}
