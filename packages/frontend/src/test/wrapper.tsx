/**
 * Wrapper React Query para testes de hooks.
 *
 * Fornece QueryClientProvider com configuração otimizada para testes
 * (sem retry, sem refetch, gcTime zero para isolamento).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/** Cria wrapper com QueryClient isolado para cada teste. */
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}
