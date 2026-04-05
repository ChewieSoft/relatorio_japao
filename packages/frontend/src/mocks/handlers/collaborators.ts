/**
 * Handler MSW para endpoint de colaboradores.
 *
 * Simula CRUD completo: GET lista paginada com busca,
 * GET detail, POST criação, PUT atualização, DELETE exclusão.
 * Formato DRF PageNumberPagination (20 itens/página).
 */
import { http, HttpResponse } from 'msw'
import { collaborators } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const PAGE_SIZE = 20

/** Dados mutáveis para simular CRUD em memória. */
let data = [...collaborators]
let nextId = data.length + 1

/** IDs marcados como soft-deleted (simula deleted_at != null). */
const deletedIds = new Set<number>()

/** Retorna registros ativos (não soft-deleted). */
function activeRecords() {
  return data.filter((c) => !deletedIds.has(c.id))
}

/** Converte registro list para formato detail (campos do modelo). */
function toDetail(record: (typeof data)[number]) {
  return {
    id: record.id,
    full_name: record.name,
    domain_user: record.domain_user,
    office: record.department,
    status: record.status,
    fired: record.fired,
    date_hired: '2024-01-15T00:00:00Z',
    date_fired: null,
    perm_acess_internet: record.has_internet_access,
    acess_wifi: false,
    admin_privilege: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    emails: [],
    cellphones: [],
    software_ids: [],
    machine_ids: [],
  }
}

export const collaboratorsHandlers = [
  /** Retorna lista paginada de colaboradores com busca opcional. */
  http.get(`${BASE}/collaborators/`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const search = (url.searchParams.get('search') || '').toLowerCase()

    let filtered = activeRecords()
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.domain_user.toLowerCase().includes(search)
      )
    }

    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = filtered.slice(start, end)

    return HttpResponse.json({
      count: filtered.length,
      next: end < filtered.length ? `${BASE}/collaborators/?page=${page + 1}` : null,
      previous: page > 1 ? `${BASE}/collaborators/?page=${page - 1}` : null,
      results,
    })
  }),

  /** Retorna detalhe de um colaborador (campos do modelo, sem aliases). */
  http.get(`${BASE}/collaborators/:id/`, ({ params }) => {
    const id = Number(params.id)
    const record = data.find((c) => c.id === id && !deletedIds.has(c.id))
    if (!record) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(toDetail(record))
  }),

  /** Cria novo colaborador. */
  http.post(`${BASE}/collaborators/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    const errors: Record<string, string[]> = {}
    const active = activeRecords()
    if (active.find((c) => c.name.toLowerCase() === String(body.full_name || '').toLowerCase())) {
      errors.full_name = ['collaborator com este full name já existe.']
    }
    if (active.find((c) => c.domain_user.toLowerCase() === String(body.domain_user || '').toLowerCase())) {
      errors.domain_user = ['collaborator com este domain user já existe.']
    }
    if (Object.keys(errors).length > 0) {
      return HttpResponse.json(errors, { status: 400 })
    }

    const id = nextId++
    const now = new Date().toISOString()
    const newRecord = {
      id,
      name: body.full_name as string,
      domain_user: body.domain_user as string,
      department: body.office as string,
      status: (body.status ?? true) as boolean,
      fired: (body.fired ?? false) as boolean,
      has_server_access: false,
      has_erp_access: false,
      has_internet_access: (body.perm_acess_internet ?? false) as boolean,
      has_cellphone: false,
      email: '',
    }
    data.push(newRecord)

    return HttpResponse.json(
      {
        id,
        full_name: body.full_name,
        domain_user: body.domain_user,
        office: body.office,
        status: body.status ?? true,
        fired: body.fired ?? false,
        date_hired: body.date_hired,
        date_fired: body.date_fired ?? null,
        perm_acess_internet: body.perm_acess_internet ?? false,
        acess_wifi: body.acess_wifi ?? false,
        admin_privilege: body.admin_privilege ?? false,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        emails: [],
        cellphones: [],
        software_ids: [],
        machine_ids: [],
      },
      { status: 201 }
    )
  }),

  /** Atualiza colaborador existente. */
  http.put(`${BASE}/collaborators/:id/`, async ({ params, request }) => {
    const id = Number(params.id)
    const idx = data.findIndex((c) => c.id === id && !deletedIds.has(c.id))
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>
    data[idx] = {
      ...data[idx],
      name: body.full_name as string,
      domain_user: body.domain_user as string,
      department: body.office as string,
      status: body.status as boolean,
      fired: body.fired as boolean,
      has_internet_access: body.perm_acess_internet as boolean,
    }

    return HttpResponse.json({
      id: data[idx].id,
      full_name: body.full_name,
      domain_user: body.domain_user,
      office: body.office,
      status: body.status,
      fired: body.fired,
      date_hired: body.date_hired,
      date_fired: body.date_fired ?? null,
      perm_acess_internet: body.perm_acess_internet ?? false,
      acess_wifi: body.acess_wifi ?? false,
      admin_privilege: body.admin_privilege ?? false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      deleted_at: null,
      emails: [],
      cellphones: [],
      software_ids: [],
      machine_ids: [],
    })
  }),

  /** Exclui colaborador (soft delete). */
  http.delete(`${BASE}/collaborators/:id/`, ({ params }) => {
    const idx = data.findIndex((c) => c.id === Number(params.id))
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    deletedIds.add(data[idx].id)
    return new HttpResponse(null, { status: 204 })
  }),
]
