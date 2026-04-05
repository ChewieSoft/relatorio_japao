/**
 * Hook genérico para orquestração CRUD em páginas de listagem.
 *
 * Centraliza estado (formulário, edição, exclusão, busca, erros server-side)
 * e handlers (create, edit, save, delete, search) reutilizados pelas páginas
 * de Colaboradores, Máquinas e Software.
 *
 * @param options - Configuração com mutations, labels e callbacks.
 * @returns Estado e handlers prontos para uso na página.
 */
import { useState } from "react"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import type { UseMutationResult } from "@tanstack/react-query"

interface CrudPageOptions<TFormData, TCreateResult, TUpdateResult> {
  /** Mutation de criação (POST). */
  createMutation: UseMutationResult<TCreateResult, Error, TFormData>
  /** Mutation de atualização (PUT). */
  updateMutation: UseMutationResult<TUpdateResult, Error, { id: number; data: TFormData }>
  /** Mutation de exclusão (DELETE). */
  deleteMutation: UseMutationResult<void, Error, number>
  /** Nome da entidade para mensagens de toast (ex: "Colaborador"). */
  entityLabel: string
}

/** Retorno do hook useCrudPage com estado e handlers. */
export interface CrudPageState<TFormData> {
  page: number
  setPage: (page: number) => void
  search: string
  formOpen: boolean
  editingId: number | null
  deletingEntity: { id: number; name: string } | null
  serverErrors: Record<string, string[]> | undefined
  isSaving: boolean
  isDeleting: boolean
  handleCreate: () => void
  handleEdit: (id: number) => void
  handleSave: (formData: TFormData) => void
  handleDelete: () => void
  handleSearchChange: (value: string) => void
  handleFormClose: (open: boolean) => void
  setDeletingEntity: (entity: { id: number; name: string } | null) => void
}

export function useCrudPage<TFormData, TCreateResult = unknown, TUpdateResult = unknown>(
  options: CrudPageOptions<TFormData, TCreateResult, TUpdateResult>
): CrudPageState<TFormData> {
  const { createMutation, updateMutation, deleteMutation, entityLabel } = options

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingEntity, setDeletingEntity] = useState<{ id: number; name: string } | null>(null)
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>()

  const handleCreate = () => {
    setEditingId(null)
    setServerErrors(undefined)
    setFormOpen(true)
  }

  const handleEdit = (id: number) => {
    setEditingId(id)
    setServerErrors(undefined)
    setFormOpen(true)
  }

  const handleApiError = (error: Error, action: string) => {
    if (isAxiosError<Record<string, string[]>>(error) && error.response?.status === 400 && error.response.data) {
      setServerErrors(error.response.data)
    } else {
      toast.error(`Erro ao ${action} ${entityLabel.toLowerCase()}.`)
    }
  }

  const handleSave = (formData: TFormData) => {
    setServerErrors(undefined)
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          setFormOpen(false)
          setEditingId(null)
          toast.success(`${entityLabel} atualizado(a) com sucesso!`)
        },
        onError: (error) => handleApiError(error, 'atualizar'),
      })
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormOpen(false)
          toast.success(`${entityLabel} cadastrado(a) com sucesso!`)
        },
        onError: (error) => handleApiError(error, 'cadastrar'),
      })
    }
  }

  const handleDelete = () => {
    if (!deletingEntity) return
    deleteMutation.mutate(deletingEntity.id, {
      onSuccess: () => {
        setDeletingEntity(null)
        toast.success(`${entityLabel} excluído(a) com sucesso!`)
      },
      onError: () => {
        toast.error(`Erro ao excluir ${entityLabel.toLowerCase()}.`)
      },
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setFormOpen(false)
      setEditingId(null)
    }
  }

  return {
    page,
    setPage,
    search,
    formOpen,
    editingId,
    deletingEntity,
    serverErrors,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleCreate,
    handleEdit,
    handleSave,
    handleDelete,
    handleSearchChange,
    handleFormClose,
    setDeletingEntity,
  }
}
