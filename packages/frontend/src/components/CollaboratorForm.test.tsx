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
    expect(screen.queryByLabelText('Data de Desligamento')).not.toBeInTheDocument()
  })

  it('desliga e desabilita "Ativo" ao ligar "Desligado"', () => {
    renderForm()
    const ativo = screen.getByLabelText('Ativo')
    expect(ativo).toBeChecked()
    fireEvent.click(screen.getByLabelText('Desligado'))
    expect(ativo).not.toBeChecked()
    expect(ativo).toBeDisabled()
  })

  it('envia status=false ao salvar com "Desligado" ligado', async () => {
    const { onSave } = renderForm()
    fireEvent.change(screen.getByLabelText('Nome Completo'), { target: { value: 'Ana Souza' } })
    fireEvent.change(screen.getByLabelText('Usuário de Domínio'), { target: { value: 'ana.souza' } })
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'TI' } })
    fireEvent.change(screen.getByLabelText('Data de Contratação'), { target: { value: '2024-01-10' } })
    fireEvent.click(screen.getByLabelText('Desligado'))
    fireEvent.change(screen.getByLabelText('Data de Desligamento'), { target: { value: '2024-02-01' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    expect(onSave.mock.calls[0][0]).toMatchObject({ fired: true, status: false })
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
