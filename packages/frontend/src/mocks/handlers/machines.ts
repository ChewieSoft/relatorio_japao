/**
 * Handler MSW para endpoint de máquinas.
 *
 * Simula CRUD completo: GET lista paginada com busca,
 * GET detail, POST criação, PUT atualização, DELETE exclusão.
 * Formato DRF PageNumberPagination (20 itens/página).
 */
import { http, HttpResponse } from 'msw'
import { machines } from '../data/fixtures'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const PAGE_SIZE = 20

/** Dados mutáveis para simular CRUD em memória. */
let data = [...machines]
let nextId = data.length + 1

/** IDs marcados como soft-deleted (simula deleted_at != null). */
const deletedIds = new Set<number>()

/** Retorna registros ativos (não soft-deleted). */
function activeRecords() {
  return data.filter((m) => !deletedIds.has(m.id))
}

/** Converte registro list para formato detail (campos do modelo). */
function toDetail(record: (typeof data)[number]) {
  return {
    id: record.id,
    hostname: record.hostname,
    model: record.model,
    type: record.machine_type,
    service_tag: record.service_tag,
    operacional_system: record.operational_system,
    ram_memory: '16GB',
    disk_memory: '512GB SSD',
    ip: record.ip,
    mac_address: record.mac_address,
    administrator: 'TI',
    cod_jdb: `JDB-${String(record.id).padStart(3, '0')}`,
    date_purchase: '2024-06-15T00:00:00Z',
    quantity: 1,
    crypto_disk: record.encrypted,
    crypto_usb: false,
    crypto_memory_card: false,
    sold_out: false,
    date_sold_out: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  }
}

export const machinesHandlers = [
  /** Retorna lista paginada de máquinas com busca opcional. */
  http.get(`${BASE}/machines/`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const search = (url.searchParams.get('search') || '').toLowerCase()

    let filtered = activeRecords()
    if (search) {
      filtered = filtered.filter(
        (m) =>
          m.hostname.toLowerCase().includes(search) ||
          m.model.toLowerCase().includes(search) ||
          m.service_tag.toLowerCase().includes(search) ||
          m.ip.toLowerCase().includes(search)
      )
    }

    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = filtered.slice(start, end)

    return HttpResponse.json({
      count: filtered.length,
      next: end < filtered.length ? `${BASE}/machines/?page=${page + 1}` : null,
      previous: page > 1 ? `${BASE}/machines/?page=${page - 1}` : null,
      results,
    })
  }),

  /** Retorna detalhe de uma máquina (campos do modelo, sem aliases). */
  http.get(`${BASE}/machines/:id/`, ({ params }) => {
    const id = Number(params.id)
    const record = data.find((m) => m.id === id && !deletedIds.has(m.id))
    if (!record) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(toDetail(record))
  }),

  /** Cria nova máquina. */
  http.post(`${BASE}/machines/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    const errors: Record<string, string[]> = {}
    if (data.find((m) => m.service_tag === body.service_tag)) {
      errors.service_tag = ['machine com este service tag já existe.']
    }
    if (data.find((m) => m.ip === body.ip)) {
      errors.ip = ['machine com este ip já existe.']
    }
    if (data.find((m) => m.mac_address === body.mac_address)) {
      errors.mac_address = ['machine com este mac address já existe.']
    }
    if (Object.keys(errors).length > 0) {
      return HttpResponse.json(errors, { status: 400 })
    }

    const id = nextId++
    const now = new Date().toISOString()
    const newRecord = {
      id,
      hostname: (body.hostname as string) || '',
      model: body.model as string,
      service_tag: body.service_tag as string,
      ip: body.ip as string,
      mac_address: body.mac_address as string,
      operational_system: body.operacional_system as string,
      encrypted: body.crypto_disk as boolean ?? false,
      antivirus: false,
      collaborator_id: null,
      collaborator_name: '',
      machine_type: body.type as 'desktop' | 'notebook',
    }
    data.push(newRecord)

    return HttpResponse.json(
      { id, ...body, created_at: now, updated_at: now, deleted_at: null },
      { status: 201 }
    )
  }),

  /** Atualiza máquina existente. */
  http.put(`${BASE}/machines/:id/`, async ({ params, request }) => {
    const idx = data.findIndex((m) => m.id === Number(params.id))
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>
    data[idx] = {
      ...data[idx],
      hostname: (body.hostname as string) || '',
      model: body.model as string,
      service_tag: body.service_tag as string,
      ip: body.ip as string,
      mac_address: body.mac_address as string,
      operational_system: body.operacional_system as string,
      encrypted: body.crypto_disk as boolean,
      machine_type: body.type as 'desktop' | 'notebook',
    }

    return HttpResponse.json({
      id: data[idx].id,
      ...body,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      deleted_at: null,
    })
  }),

  /** Exclui máquina (soft delete). */
  http.delete(`${BASE}/machines/:id/`, ({ params }) => {
    const idx = data.findIndex((m) => m.id === Number(params.id))
    if (idx === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    deletedIds.add(data[idx].id)
    return new HttpResponse(null, { status: 204 })
  }),
]
