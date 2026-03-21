/**
 * Handler MSW para endpoint de estatísticas do dashboard.
 *
 * Simula GET /api/dashboard/stats/ computando KPIs
 * a partir dos dados mock de fixtures.
 */
import { http, HttpResponse } from 'msw'
import { collaborators, machines, software, reports } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const dashboardHandlers = [
  /** Retorna estatísticas consolidadas para o dashboard. */
  http.get(`${BASE}/dashboard/stats/`, () => {
    return HttpResponse.json({
      active_collaborators: collaborators.filter(c => c.status).length,
      total_collaborators: collaborators.length,
      total_machines: machines.length,
      total_software: software.length,
      pending_reports: reports.filter(r => r.status === 'pending').length,
      total_reports: reports.length,
      machines_without_encryption: machines.filter(m => !m.encrypted).map(m => m.hostname),
    })
  }),
]
