/**
 * Testes unitários para o combobox de seleção de colaborador.
 *
 * Verifica o placeholder, o rótulo pré-selecionado em modo edição, e os
 * callbacks de seleção e limpeza. O hook useCollaborators é mockado para
 * isolar o componente da camada de dados.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CollaboratorCombobox from './CollaboratorCombobox'

vi.mock('@/hooks/useCollaborators', () => ({
  useCollaborators: vi.fn(() => ({
    data: {
      results: [
        { id: 1, name: 'Carlos Tanaka', department: 'TI' },
        { id: 2, name: 'Maria Suzuki', department: 'RH' },
      ],
    },
    isLoading: false,
  })),
}))

describe('CollaboratorCombobox', () => {
  it('exibe placeholder quando nenhum usuário está selecionado', () => {
    render(<CollaboratorCombobox value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Selecione um usuário')).toBeInTheDocument()
  })

  it('exibe o nome inicial quando há usuário selecionado (modo edição)', () => {
    render(<CollaboratorCombobox value={1} onChange={vi.fn()} initialLabel="Carlos Tanaka" />)
    expect(screen.getByText('Carlos Tanaka')).toBeInTheDocument()
  })

  it('chama onChange com o id ao selecionar um colaborador', () => {
    const onChange = vi.fn()
    render(<CollaboratorCombobox value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Maria Suzuki'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('chama onChange com null ao limpar a seleção', () => {
    const onChange = vi.fn()
    render(<CollaboratorCombobox value={1} onChange={onChange} initialLabel="Carlos Tanaka" />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Nenhum (limpar)'))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
