/**
 * Testes de integração da página de software.
 *
 * Renderiza a página completa com MSW simulando a API,
 * verificando listagem, criação (abre formulário), edição
 * (botão de ação) e exclusão (diálogo de confirmação).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { softwareHandlers, resetSoftwareState } from '@/mocks/handlers/software'
import { createPageWrapper } from '@/test/page-wrapper'
import SoftwarePage from './SoftwarePage'

const server = setupServer(...softwareHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  resetSoftwareState()
})
afterAll(() => server.close())

describe('SoftwarePage', () => {
  it('renderiza tabela com dados da API', async () => {
    const Wrapper = createPageWrapper()
    render(<SoftwarePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Microsoft Office 365')).toBeInTheDocument()
    })
    expect(screen.getByText('AutoCAD 2024')).toBeInTheDocument()
  })

  it('exibe botão Novo Software', async () => {
    const Wrapper = createPageWrapper()
    render(<SoftwarePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /novo software/i })).toBeInTheDocument()
    })
  })

  it('abre formulário de criação ao clicar em Novo Software', async () => {
    const Wrapper = createPageWrapper()
    render(<SoftwarePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Microsoft Office 365')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /novo software/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Novo Software' })).toBeInTheDocument()
    })
  })

  it('exibe botões de editar e excluir em cada linha', async () => {
    const Wrapper = createPageWrapper()
    render(<SoftwarePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Microsoft Office 365')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button', { name: 'Editar' })
    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    expect(editButtons.length).toBeGreaterThan(0)
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it('abre diálogo de confirmação ao clicar em Excluir', async () => {
    const Wrapper = createPageWrapper()
    render(<SoftwarePage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Microsoft Office 365')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Excluir' })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
    })
  })

  it('exibe campo de busca', async () => {
    const Wrapper = createPageWrapper()
    render(<SoftwarePage />, { wrapper: Wrapper })

    expect(screen.getByPlaceholderText(/buscar por nome ou chave/i)).toBeInTheDocument()
  })
})
