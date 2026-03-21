/**
 * Componente raiz da aplicação JRC Brasil.
 *
 * Configura QueryClient (React Query), BrowserRouter,
 * AuthProvider e ProtectedRoute para todas as rotas
 * exceto /login.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "./auth/AuthContext"
import ProtectedRoute from "./auth/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Collaborators from "./pages/Collaborators"
import Machines from "./pages/Machines"
import SoftwarePage from "./pages/SoftwarePage"
import Reports from "./pages/Reports"
import NotFound from "./pages/NotFound"

/** Tempo em que dados são considerados frescos (5 minutos). */
const STALE_TIME = 1000 * 60 * 5
/** Tempo de retenção no garbage collector do cache (10 minutos). */
const GC_TIME = 1000 * 60 * 10

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/collaborators" element={<ProtectedRoute><Collaborators /></ProtectedRoute>} />
            <Route path="/machines" element={<ProtectedRoute><Machines /></ProtectedRoute>} />
            <Route path="/software" element={<ProtectedRoute><SoftwarePage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
