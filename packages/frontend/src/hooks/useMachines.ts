/**
 * Hooks React Query para máquinas.
 *
 * Inclui listagem paginada com busca, detalhe para edição,
 * e mutations de criação, atualização e exclusão.
 * Transformações snake_case↔camelCase acontecem nesta camada.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '../api/client'
import type { PaginatedResponse } from '../types/api'
import type { Machine, MachineFormData } from '../types/entities'
import { toMachinePayload, toMachineFormData } from '../types/entities'

/**
 * Lista máquinas paginadas com busca opcional.
 *
 * @param page - Número da página (default: 1).
 * @param search - Termo de busca server-side (opcional).
 * @returns Resultado da query com dados paginados de máquinas.
 */
export function useMachines(page = 1, search = '') {
  return useQuery({
    queryKey: ['machines', page, search],
    queryFn: async (): Promise<PaginatedResponse<Machine>> => {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      const res = await api.get(`/machines/?${params}`)
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
    placeholderData: keepPreviousData,
  })
}

/**
 * Busca detalhe de uma máquina para edição.
 *
 * @param id - ID da máquina (null desabilita a query).
 * @returns Resultado da query com MachineFormData.
 */
export function useMachine(id: number | null) {
  return useQuery({
    queryKey: ['machines', 'detail', id],
    queryFn: async (): Promise<MachineFormData> => {
      const res = await api.get(`/machines/${id}/`)
      return toMachineFormData(res.data)
    },
    enabled: id !== null,
  })
}

/**
 * Mutation para criar nova máquina.
 *
 * @returns Mutation do React Query para POST /api/machines/.
 */
export function useCreateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: MachineFormData) => {
      const res = await api.post('/machines/', toMachinePayload(data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Mutation para atualizar máquina existente.
 *
 * @returns Mutation do React Query para PUT /api/machines/{id}/.
 */
export function useUpdateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MachineFormData }) => {
      const res = await api.put(`/machines/${id}/`, toMachinePayload(data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Mutation para excluir máquina (soft delete).
 *
 * @returns Mutation do React Query para DELETE /api/machines/{id}/.
 */
export function useDeleteMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/machines/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
