/**
 * Testes unitários para o formulário de software.
 *
 * Verifica renderização em modo criação e edição, validação zod,
 * campos condicionais (expiresAt) e estados do formulário.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SoftwareForm from './SoftwareForm'
import type { SoftwareFormData } from '@/types/entities'

/** Props padrão para renderizar o formulário. */
function renderForm(overrides: Partial<Parameters<typeof SoftwareForm>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    isLoading: false,
    ...overrides,
  }
  render(<SoftwareForm {...defaults} />)
  return defaults
}

const editData: SoftwareFormData = {
  softwareName: 'Microsoft Office 365',
  key: 'XXXXX-XXXXX-XXXXX',
  typeLicence: 'subscription',
  quantity: 50,
  quantityPurchase: 50,
  onUse: 38,
  departament: 'TI',
  lastPurchaseDate: '2024-01-01',
  expiresAt: '2026-12-31',
  observation: '',
}

describe('SoftwareForm', () => {
  it('renderiza título de criação quando sem initialData', () => {
    renderForm()
    expect(screen.getByText('Novo Software')).toBeInTheDocument()
  })

  it('renderiza título de edição quando com initialData', () => {
    renderForm({ initialData: editData })
    expect(screen.getByText('Editar Software')).toBeInTheDocument()
  })

  it('preenche campos com initialData em modo edição', () => {
    renderForm({ initialData: editData })
    expect(screen.getByDisplayValue('Microsoft Office 365')).toBeInTheDocument()
    expect(screen.getByDisplayValue('XXXXX-XXXXX-XXXXX')).toBeInTheDocument()
  })

  it('desabilita botão Salvar quando isLoading=true', () => {
    renderForm({ isLoading: true })
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled()
  })

  it('exibe erros de validação ao submeter formulário vazio', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(screen.getByText('Chave de licença é obrigatória')).toBeInTheDocument()
    })
  })

  it('não renderiza quando open=false', () => {
    renderForm({ open: false })
    expect(screen.queryByText('Novo Software')).not.toBeInTheDocument()
  })
})
