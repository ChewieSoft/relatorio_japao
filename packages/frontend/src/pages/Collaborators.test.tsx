/**
 * Testes de integração da página de colaboradores.
 *
 * Renderiza a página completa com MSW simulando a API,
 * verificando listagem, criação (abre formulário), edição
 * (botão de ação) e exclusão (diálogo de confirmação).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { collaboratorsHandlers } from '@/mocks/handlers/collaborators'
import { createPageWrapper } from '@/test/page-wrapper'
import Collaborators from './Collaborators'

const server = setupServer(...collaboratorsHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Collaborators Page', () => {
  it('renderiza tabela com dados da API', async () => {
    const Wrapper = createPageWrapper()
    render(<Collaborators />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Carlos Tanaka')).toBeInTheDocument()
    })
    expect(screen.getByText('Maria Suzuki')).toBeInTheDocument()
  })

  it('exibe botão Novo Colaborador', async () => {
    const Wrapper = createPageWrapper()
    render(<Collaborators />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /novo colaborador/i })).toBeInTheDocument()
    })
  })

  it('abre formulário de criação ao clicar em Novo Colaborador', async () => {
    const Wrapper = createPageWrapper()
    render(<Collaborators />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Carlos Tanaka')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /novo colaborador/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Novo Colaborador' })).toBeInTheDocument()
    })
  })

  it('exibe botões de editar e excluir em cada linha', async () => {
    const Wrapper = createPageWrapper()
    render(<Collaborators />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Carlos Tanaka')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button', { name: 'Editar' })
    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    expect(editButtons.length).toBeGreaterThan(0)
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('abre diálogo de confirmação ao clicar em Excluir', async () => {
    const Wrapper = createPageWrapper()
    render(<Collaborators />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Carlos Tanaka')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
    })
  })

  it('exibe campo de busca', async () => {
    const Wrapper = createPageWrapper()
    render(<Collaborators />, { wrapper: Wrapper })

    expect(screen.getByPlaceholderText(/buscar por nome ou domínio/i)).toBeInTheDocument()
  })
})
