/**
 * Hooks React Query para software.
 *
 * Inclui listagem paginada com busca, detalhe para edição,
 * e mutations de criação, atualização e exclusão.
 * Transformações snake_case↔camelCase acontecem nesta camada.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '../api/client'
import type { PaginatedResponse } from '../types/api'
import type { Software, SoftwareFormData } from '../types/entities'
import { toSoftwarePayload, toSoftwareFormData } from '../types/entities'

/**
 * Lista software paginado com busca opcional.
 *
 * @param page - Número da página (default: 1).
 * @param search - Termo de busca server-side (opcional).
 * @returns Resultado da query com dados paginados de software.
 */
export function useSoftware(page = 1, search = '') {
  return useQuery({
    queryKey: ['software', page, search],
    queryFn: async (): Promise<PaginatedResponse<Software>> => {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      const res = await api.get(`/software/?${params}`)
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
    placeholderData: keepPreviousData,
  })
}

/**
 * Busca detalhe de um software para edição.
 *
 * @param id - ID do software (null desabilita a query).
 * @returns Resultado da query com SoftwareFormData.
 */
export function useSoftwareDetail(id: number | null) {
  return useQuery({
    queryKey: ['software', 'detail', id],
    queryFn: async (): Promise<SoftwareFormData> => {
      const res = await api.get(`/software/${id}/`)
      return toSoftwareFormData(res.data)
    },
    enabled: id !== null,
  })
}

/**
 * Mutation para criar novo software.
 *
 * @returns Mutation do React Query para POST /api/software/.
 */
export function useCreateSoftware() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SoftwareFormData) => {
      const res = await api.post('/software/', toSoftwarePayload(data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Mutation para atualizar software existente.
 *
 * @returns Mutation do React Query para PUT /api/software/{id}/.
 */
export function useUpdateSoftware() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SoftwareFormData }) => {
      const res = await api.put(`/software/${id}/`, toSoftwarePayload(data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Mutation para excluir software (soft delete).
 *
 * @returns Mutation do React Query para DELETE /api/software/{id}/.
 */
export function useDeleteSoftware() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/software/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
