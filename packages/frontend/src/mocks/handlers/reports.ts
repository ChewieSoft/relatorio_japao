/**
 * Handlers MSW para endpoints de relatórios.
 *
 * Simula GET /api/reports/ (lista), POST /api/reports/:number/generate/
 * (geração) e GET /api/reports/:number/ com query format=pdf|xlsx (download).
 */
import { http, HttpResponse } from 'msw'
import { reports } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const reportsHandlers = [
  /** Retorna lista de todos os relatórios. */
  http.get(`${BASE}/reports/`, () => {
    return HttpResponse.json({
      count: reports.length,
      next: null,
      previous: null,
      results: reports,
    })
  }),

  /** Simula geração de relatório, retornando status atualizado. */
  http.post(`${BASE}/reports/:number/generate/`, () => {
    return HttpResponse.json({
      status: 'generated',
      last_generated: new Date().toISOString(),
    })
  }),

  /** Simula download de relatório em PDF ou Excel (retorna blob mock). */
  http.get(`${BASE}/reports/:number/`, ({ request, params }) => {
    const url = new URL(request.url)
    const format = url.searchParams.get('format')

    if (format === 'pdf') {
      return new HttpResponse(new Blob(['mock-pdf-content'], { type: 'application/pdf' }), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio_${params.number}.pdf"`,
        },
      })
    }

    if (format === 'xlsx') {
      return new HttpResponse(
        new Blob(['mock-xlsx-content'], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="relatorio_${params.number}.xlsx"`,
          },
        }
      )
    }

    return HttpResponse.json({ detail: 'Format parameter required (pdf or xlsx)' }, { status: 400 })
  }),
]
