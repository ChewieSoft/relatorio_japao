/**
 * Testes unitários para o hook useCrudPage.
 *
 * Verifica orquestração CRUD: estado inicial, handleCreate, handleEdit,
 * handleSave (create/update), handleDelete, handleSearchChange e reset.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCrudPage } from './useCrudPage'

/** Cria mock de UseMutationResult para testes. */
function createMockMutation() {
  const mutate = vi.fn()
  return {
    mutate,
    isPending: false,
    isError: false,
    isIdle: true,
    isSuccess: false,
    data: undefined,
    error: null,
    reset: vi.fn(),
    status: 'idle' as const,
    variables: undefined,
    failureCount: 0,
    failureReason: null,
    context: undefined,
    isPaused: false,
    submittedAt: 0,
    mutateAsync: vi.fn(),
  }
}

describe('useCrudPage', () => {
  let createMutation: ReturnType<typeof createMockMutation>
  let updateMutation: ReturnType<typeof createMockMutation>
  let deleteMutation: ReturnType<typeof createMockMutation>

  beforeEach(() => {
    createMutation = createMockMutation()
    updateMutation = createMockMutation()
    deleteMutation = createMockMutation()
  })

  /** Renderiza o hook com mocks padrão. */
  function renderCrud() {
    return renderHook(() =>
      useCrudPage<{ name: string }>({
        createMutation: createMutation as never,
        updateMutation: updateMutation as never,
        deleteMutation: deleteMutation as never,
        entityLabel: 'Teste',
      })
    )
  }

  it('inicializa com estado padrão', () => {
    const { result } = renderCrud()
    expect(result.current.page).toBe(1)
    expect(result.current.search).toBe('')
    expect(result.current.formOpen).toBe(false)
    expect(result.current.editingId).toBeNull()
    expect(result.current.deletingEntity).toBeNull()
    expect(result.current.serverErrors).toBeUndefined()
  })

  it('handleCreate abre formulário em modo criação', () => {
    const { result } = renderCrud()
    act(() => result.current.handleCreate())
    expect(result.current.formOpen).toBe(true)
    expect(result.current.editingId).toBeNull()
  })

  it('handleEdit abre formulário em modo edição com ID', () => {
    const { result } = renderCrud()
    act(() => result.current.handleEdit(42))
    expect(result.current.formOpen).toBe(true)
    expect(result.current.editingId).toBe(42)
  })

  it('handleSave chama createMutation quando editingId é null', () => {
    const { result } = renderCrud()
    act(() => result.current.handleCreate())
    act(() => result.current.handleSave({ name: 'Novo' }))
    expect(createMutation.mutate).toHaveBeenCalledTimes(1)
    expect(updateMutation.mutate).not.toHaveBeenCalled()
  })

  it('handleSave chama updateMutation quando editingId está definido', () => {
    const { result } = renderCrud()
    act(() => result.current.handleEdit(5))
    act(() => result.current.handleSave({ name: 'Atualizado' }))
    expect(updateMutation.mutate).toHaveBeenCalledTimes(1)
    expect(createMutation.mutate).not.toHaveBeenCalled()
  })

  it('handleDelete não chama mutation sem deletingEntity', () => {
    const { result } = renderCrud()
    act(() => result.current.handleDelete())
    expect(deleteMutation.mutate).not.toHaveBeenCalled()
  })

  it('handleDelete chama mutation com ID correto', () => {
    const { result } = renderCrud()
    act(() => result.current.setDeletingEntity({ id: 7, name: 'Item' }))
    act(() => result.current.handleDelete())
    expect(deleteMutation.mutate).toHaveBeenCalledWith(7, expect.any(Object))
  })

  it('handleSearchChange atualiza busca e reseta página para 1', () => {
    const { result } = renderCrud()
    act(() => result.current.setPage(3))
    expect(result.current.page).toBe(3)
    act(() => result.current.handleSearchChange('teste'))
    expect(result.current.search).toBe('teste')
    expect(result.current.page).toBe(1)
  })

  it('handleFormClose fecha formulário e limpa editingId', () => {
    const { result } = renderCrud()
    act(() => result.current.handleEdit(10))
    expect(result.current.formOpen).toBe(true)
    act(() => result.current.handleFormClose(false))
    expect(result.current.formOpen).toBe(false)
    expect(result.current.editingId).toBeNull()
  })

  it('handleFormClose com open=true não fecha', () => {
    const { result } = renderCrud()
    act(() => result.current.handleCreate())
    act(() => result.current.handleFormClose(true))
    expect(result.current.formOpen).toBe(true)
  })
})
