/**
 * Componente de guarda de rota autenticada.
 *
 * Redireciona para /login se o usuário não está autenticado.
 * Exibe spinner durante verificação de token no mount.
 *
 * @param props.children - Componentes a renderizar se autenticado.
 * @returns Spinner, redirect ou children.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        <span className="sr-only">Carregando…</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}
