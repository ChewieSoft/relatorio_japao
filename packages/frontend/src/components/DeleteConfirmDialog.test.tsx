/**
 * Testes unitários para o componente DeleteConfirmDialog.
 *
 * Verifica renderização do nome da entidade, botões de ação,
 * estado de loading e callbacks de confirmação/cancelamento.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeleteConfirmDialog from './DeleteConfirmDialog'

/** Renderiza o dialog com props padrão. */
function renderDialog(overrides: Partial<Parameters<typeof DeleteConfirmDialog>[0]> = {}) {
  const defaults = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    entityName: 'Carlos Tanaka',
    isLoading: false,
    ...overrides,
  }
  render(<DeleteConfirmDialog {...defaults} />)
  return defaults
}

describe('DeleteConfirmDialog', () => {
  it('exibe nome da entidade na mensagem', () => {
    renderDialog()
    expect(screen.getByText('Carlos Tanaka')).toBeInTheDocument()
  })

  it('exibe mensagem de soft delete', () => {
    renderDialog()
    expect(screen.getByText(/O registro será desativado/)).toBeInTheDocument()
  })

  it('chama onConfirm ao clicar em Excluir', () => {
    const props = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('chama onCancel ao clicar em Cancelar', () => {
    const props = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(props.onCancel).toHaveBeenCalled()
  })

  it('desabilita botões quando isLoading=true', () => {
    renderDialog({ isLoading: true })
    expect(screen.getByRole('button', { name: /excluir/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
  })

  it('não renderiza quando open=false', () => {
    renderDialog({ open: false })
    expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument()
  })
})
