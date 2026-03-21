/**
 * Hook React Query para relatórios de auditoria.
 *
 * Fornece listagem via useQuery, geração via useMutation
 * e função de download em PDF/Excel via blob.
 *
 * @returns Objeto com query de listagem, mutation de geração e função de download.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { PaginatedResponse } from '../types/api'
import type { Report } from '../types/entities'

/** Busca lista de todos os relatórios da API. */
function useReportsList() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async (): Promise<PaginatedResponse<Report>> => {
      const res = await api.get('/reports/')
      return {
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
        results: res.data.results.map((r: Record<string, unknown>) => ({
          id: r.id,
          number: r.number,
          name: r.name,
          nameJp: r.name_jp,
          category: r.category,
          lastGenerated: r.last_generated,
          status: r.status,
        })),
      }
    },
    staleTime: 1000 * 60 * 15,
  })
}

/** Mutation para gerar um relatório, invalidando lista e stats do dashboard após sucesso. */
function useGenerateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reportNumber: string) =>
      api.post(`/reports/${reportNumber}/generate/`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Faz download de relatório em PDF ou Excel via blob.
 *
 * @param reportNumber - Número do relatório (ex: "08").
 * @param format - Formato do download ("pdf" ou "xlsx").
 */
async function downloadReport(reportNumber: string, format: 'pdf' | 'xlsx') {
  const res = await api.get(`/reports/${reportNumber}/?format=${format}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio_${reportNumber}.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export { useReportsList, useGenerateReport, downloadReport }
