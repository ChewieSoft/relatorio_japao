/**
 * Wrapper completo para testes de integração de páginas.
 *
 * Fornece QueryClientProvider, MemoryRouter e AuthProvider mockado
 * para renderizar páginas que dependem de rotas e autenticação.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

/** Mock do AuthContext para testes de página (usuário logado). */
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', is_staff: true },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))

/** Cria wrapper com todos os providers necessários para testes de página. */
export function createPageWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return function PageWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}
