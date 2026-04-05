/**
 * Hooks React Query para colaboradores.
 *
 * Inclui listagem paginada com busca, detalhe para edição,
 * e mutations de criação, atualização e exclusão.
 * Transformações snake_case↔camelCase acontecem nesta camada.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '../api/client'
import type { PaginatedResponse } from '../types/api'
import type { Collaborator, CollaboratorFormData } from '../types/entities'
import { toCollaboratorPayload, toCollaboratorFormData } from '../types/entities'

/**
 * Lista colaboradores paginados com busca opcional.
 *
 * @param page - Número da página (default: 1).
 * @param search - Termo de busca server-side (opcional).
 * @returns Resultado da query com dados paginados de colaboradores.
 */
export function useCollaborators(page = 1, search = '') {
  return useQuery({
    queryKey: ['collaborators', page, search],
    queryFn: async (): Promise<PaginatedResponse<Collaborator>> => {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      const res = await api.get(`/collaborators/?${params}`)
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
    placeholderData: keepPreviousData,
  })
}

/**
 * Busca detalhe de um colaborador para edição.
 *
 * Retorna dados no formato camelCase do formulário.
 * Habilitado apenas quando id é fornecido.
 *
 * @param id - ID do colaborador (null desabilita a query).
 * @returns Resultado da query com CollaboratorFormData.
 */
export function useCollaborator(id: number | null) {
  return useQuery({
    queryKey: ['collaborators', 'detail', id],
    queryFn: async (): Promise<CollaboratorFormData> => {
      const res = await api.get(`/collaborators/${id}/`)
      return toCollaboratorFormData(res.data)
    },
    enabled: id !== null,
  })
}

/**
 * Mutation para criar novo colaborador.
 *
 * Converte camelCase→snake_case e invalida cache após sucesso.
 *
 * @returns Mutation do React Query para POST /api/collaborators/.
 */
export function useCreateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CollaboratorFormData) => {
      const res = await api.post('/collaborators/', toCollaboratorPayload(data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Mutation para atualizar colaborador existente.
 *
 * @returns Mutation do React Query para PUT /api/collaborators/{id}/.
 */
export function useUpdateCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CollaboratorFormData }) => {
      const res = await api.put(`/collaborators/${id}/`, toCollaboratorPayload(data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Mutation para excluir colaborador (soft delete).
 *
 * @returns Mutation do React Query para DELETE /api/collaborators/{id}/.
 */
export function useDeleteCollaborator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/collaborators/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
