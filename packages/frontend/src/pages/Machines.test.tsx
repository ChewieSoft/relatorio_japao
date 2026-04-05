/**
 * Testes de integração da página de máquinas.
 *
 * Renderiza a página completa com MSW simulando a API,
 * verificando listagem, criação (abre formulário), edição
 * (botão de ação) e exclusão (diálogo de confirmação).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { machinesHandlers } from '@/mocks/handlers/machines'
import { createPageWrapper } from '@/test/page-wrapper'
import Machines from './Machines'

const server = setupServer(...machinesHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Machines Page', () => {
  it('renderiza tabela com dados da API', async () => {
    const Wrapper = createPageWrapper()
    render(<Machines />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('JRC-ENG-001')).toBeInTheDocument()
    })
    expect(screen.getByText('ABCD1234')).toBeInTheDocument()
  })

  it('exibe botão Nova Máquina', async () => {
    const Wrapper = createPageWrapper()
    render(<Machines />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nova máquina/i })).toBeInTheDocument()
    })
  })

  it('abre formulário de criação ao clicar em Nova Máquina', async () => {
    const Wrapper = createPageWrapper()
    render(<Machines />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('JRC-ENG-001')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /nova máquina/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nova Máquina' })).toBeInTheDocument()
    })
  })

  it('exibe botões de editar e excluir em cada linha', async () => {
    const Wrapper = createPageWrapper()
    render(<Machines />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('JRC-ENG-001')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button', { name: 'Editar' })
    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    expect(editButtons.length).toBeGreaterThan(0)
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('abre diálogo de confirmação ao clicar em Excluir', async () => {
    const Wrapper = createPageWrapper()
    render(<Machines />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('JRC-ENG-001')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
    })
  })

  it('exibe campo de busca', async () => {
    const Wrapper = createPageWrapper()
    render(<Machines />, { wrapper: Wrapper })

    expect(screen.getByPlaceholderText(/buscar por hostname/i)).toBeInTheDocument()
  })
})
