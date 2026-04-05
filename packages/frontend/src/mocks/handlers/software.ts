/**
 * Handler MSW para endpoint de software.
 *
 * Simula CRUD completo: GET lista paginada com busca,
 * GET detail, POST criação, PUT atualização, DELETE exclusão.
 * Formato DRF PageNumberPagination (20 itens/página).
 */
import { http, HttpResponse } from 'msw'
import { software } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const PAGE_SIZE = 20

/** Dados mutáveis para simular CRUD em memória. */
let data = [...software]
let nextId = data.length + 1

/** Converte registro list para formato detail (campos do modelo). */
function toDetail(record: (typeof data)[number]) {
  return {
    id: record.id,
    software_name: record.software_name,
    key: record.license_key,
    type_licence: record.license_type,
    quantity: record.quantity,
    quantity_purchase: record.quantity,
    on_use: record.in_use,
    departament: 'TI',
    last_purchase_date: '2024-01-01T00:00:00Z',
    expires_at: record.expires_at ? `${record.expires_at}T00:00:00Z` : null,
    observation: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  }
}

export const softwareHandlers = [
  /** Retorna lista paginada de software com busca opcional. */
  http.get(`${BASE}/software/`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const search = (url.searchParams.get('search') || '').toLowerCase()

    let filtered = data
    if (search) {
      filtered = data.filter(
        (s) =>
          s.software_name.toLowerCase().includes(search) ||
          s.license_key.toLowerCase().includes(search)
      )
    }

    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = filtered.slice(start, end)

    return HttpResponse.json({
      count: filtered.length,
      next: end < filtered.length ? `${BASE}/software/?page=${page + 1}` : null,
      previous: page > 1 ? `${BASE}/software/?page=${page - 1}` : null,
      results,
    })
  }),

  /** Retorna detalhe de um software (campos do modelo, sem aliases). */
  http.get(`${BASE}/software/:id/`, ({ params }) => {
    const record = data.find((s) => s.id === Number(params.id))
    if (!record) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(toDetail(record))
  }),

  /** Cria novo software. */
  http.post(`${BASE}/software/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    const id = nextId++
    const now = new Date().toISOString()
    const newRecord = {
      id,
      software_name: (body.software_name as string) || '',
      license_key: body.key as string,
      license_type: body.type_licence as string,
      quantity: (body.quantity as number) ?? 0,
      in_use: (body.on_use as number) ?? 0,
      expires_at: (body.expires_at as string)?.slice(0, 10) || null,
    }
    data.push(newRecord)

    return HttpResponse.json(
      { id, ...body, created_at: now, updated_at: now, deleted_at: null },
      { status: 201 }
    )
  }),

  /** Atualiza software existente. */
  http.put(`${BASE}/software/:id/`, async ({ params, request }) => {
    const idx = data.findIndex((s) => s.id === Number(params.id))
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>
    data[idx] = {
      ...data[idx],
      software_name: (body.software_name as string) || '',
      license_key: body.key as string,
      license_type: body.type_licence as string,
      quantity: (body.quantity as number) ?? 0,
      in_use: (body.on_use as number) ?? 0,
      expires_at: (body.expires_at as string)?.slice(0, 10) || null,
    }

    return HttpResponse.json({
      id: data[idx].id,
      ...body,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      deleted_at: null,
    })
  }),

  /** Exclui software (soft delete). */
  http.delete(`${BASE}/software/:id/`, ({ params }) => {
    const idx = data.findIndex((s) => s.id === Number(params.id))
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    data.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
