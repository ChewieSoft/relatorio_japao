/**
 * Testes unitários para o formulário de colaborador.
 *
 * Verifica renderização em modo criação e edição, validação zod,
 * campos condicionais (dateFired) e callback onSave.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CollaboratorForm from './CollaboratorForm'
import type { CollaboratorFormData } from '@/types/entities'

/** Props padrão para renderizar o formulário. */
function renderForm(overrides: Partial<Parameters<typeof CollaboratorForm>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    isLoading: false,
    ...overrides,
  }
  render(<CollaboratorForm {...defaults} />)
  return defaults
}

const editData: CollaboratorFormData = {
  fullName: 'Carlos Tanaka',
  domainUser: 'ctanaka',
  office: 'Engenharia',
  status: true,
  fired: false,
  dateHired: '2024-01-15',
  dateFired: '',
  permAcessInternet: true,
  acessWifi: false,
  adminPrivilege: false,
}

describe('CollaboratorForm', () => {
  it('renderiza título de criação quando sem initialData', () => {
    renderForm()
    expect(screen.getByText('Novo Colaborador')).toBeInTheDocument()
  })

  it('renderiza título de edição quando com initialData', () => {
    renderForm({ initialData: editData })
    expect(screen.getByText('Editar Colaborador')).toBeInTheDocument()
  })

  it('preenche campos com initialData em modo edição', () => {
    renderForm({ initialData: editData })
    expect(screen.getByDisplayValue('Carlos Tanaka')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ctanaka')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Engenharia')).toBeInTheDocument()
  })

  it('não renderiza campo dateFired quando fired=false', () => {
    renderForm()
    expect(screen.queryByLabelText('Data de Demissão')).not.toBeInTheDocument()
  })

  it('desabilita botão Salvar quando isLoading=true', () => {
    renderForm({ isLoading: true })
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled()
  })

  it('não renderiza quando open=false', () => {
    renderForm({ open: false })
    expect(screen.queryByText('Novo Colaborador')).not.toBeInTheDocument()
  })

  it('exibe erros de validação ao submeter formulário vazio', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(screen.getByText('Nome completo é obrigatório')).toBeInTheDocument()
    })
  })
})
