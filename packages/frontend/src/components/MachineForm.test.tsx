/**
 * Testes unitários para o formulário de máquina.
 *
 * Verifica renderização em modo criação e edição, validação zod,
 * campos condicionais (dateSoldOut) e estados do formulário.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MachineForm from './MachineForm'
import type { MachineFormData } from '@/types/entities'

/** Props padrão para renderizar o formulário. */
function renderForm(overrides: Partial<Parameters<typeof MachineForm>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    isLoading: false,
    ...overrides,
  }
  render(<MachineForm {...defaults} />)
  return defaults
}

const editData: MachineFormData = {
  hostname: 'JRC-TI-001',
  model: 'Dell OptiPlex 7090',
  type: 'desktop',
  serviceTag: 'ABCD1234',
  operacionalSystem: 'Windows 11 Pro',
  ramMemory: '16GB',
  diskMemory: '512GB SSD',
  ip: '192.168.1.100',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  administrator: 'TI',
  codJdb: 'JDB-001',
  datePurchase: '2024-06-15',
  quantity: 1,
  cryptoDisk: true,
  cryptoUsb: false,
  cryptoMemoryCard: false,
  soldOut: false,
  dateSoldOut: '',
}

describe('MachineForm', () => {
  it('renderiza título de criação quando sem initialData', () => {
    renderForm()
    expect(screen.getByText('Nova Máquina')).toBeInTheDocument()
  })

  it('renderiza título de edição quando com initialData', () => {
    renderForm({ initialData: editData })
    expect(screen.getByText('Editar Máquina')).toBeInTheDocument()
  })

  it('preenche campos com initialData em modo edição', () => {
    renderForm({ initialData: editData })
    expect(screen.getByDisplayValue('JRC-TI-001')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ABCD1234')).toBeInTheDocument()
    expect(screen.getByDisplayValue('192.168.1.100')).toBeInTheDocument()
  })

  it('não renderiza campo dateSoldOut quando soldOut=false', () => {
    renderForm()
    expect(screen.queryByLabelText('Data de Baixa')).not.toBeInTheDocument()
  })

  it('desabilita botão Salvar quando isLoading=true', () => {
    renderForm({ isLoading: true })
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled()
  })

  it('exibe erros de validação ao submeter formulário vazio', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(screen.getByText('Modelo é obrigatório')).toBeInTheDocument()
    })
  })
})
