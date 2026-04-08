/**
 * Testes unitários para hooks de colaboradores.
 *
 * Verifica listagem paginada com busca, detalhe para edição,
 * e mutations de criação, atualização e exclusão.
 * Mocka o cliente Axios para isolar a camada de hooks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/wrapper'
import { useCollaborators, useCollaborator, useCreateCollaborator, useUpdateCollaborator, useDeleteCollaborator } from './useCollaborators'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../api/client'
const mockApi = vi.mocked(api)

const mockListResponse = {
  data: {
    count: 2,
    next: null,
    previous: null,
    results: [
      { id: 1, name: 'Carlos', domain_user: 'ctanaka', department: 'TI', status: true, fired: false, has_server_access: true, has_erp_access: false, has_internet_access: true, has_cellphone: false, email: 'c@jrc.com' },
      { id: 2, name: 'Maria', domain_user: 'msuzuki', department: 'RH', status: true, fired: false, has_server_access: false, has_erp_access: true, has_internet_access: true, has_cellphone: true, email: 'm@jrc.com' },
    ],
  },
}

const mockDetailResponse = {
  data: {
    id: 1, full_name: 'Carlos Tanaka', domain_user: 'ctanaka', office: 'TI',
    status: true, fired: false, date_hired: '2024-01-15T00:00:00Z', date_fired: null,
    perm_acess_internet: true, acess_wifi: false, admin_privilege: false,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCollaborators', () => {
  it('busca lista paginada e transforma snake_case para camelCase', async () => {
    mockApi.get.mockResolvedValue(mockListResponse)
    const { result } = renderHook(() => useCollaborators(1), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApi.get).toHaveBeenCalledWith('/collaborators/?page=1')
    expect(result.current.data?.results[0].domainUser).toBe('ctanaka')
    expect(result.current.data?.results[0].hasServerAccess).toBe(true)
    expect(result.current.data?.count).toBe(2)
  })

  it('inclui parâmetro search na URL quando fornecido', async () => {
    mockApi.get.mockResolvedValue(mockListResponse)
    renderHook(() => useCollaborators(1, 'carlos'), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled())
    expect(mockApi.get).toHaveBeenCalledWith('/collaborators/?page=1&search=carlos')
  })
})

describe('useCollaborator', () => {
  it('busca detalhe e converte para CollaboratorFormData', async () => {
    mockApi.get.mockResolvedValue(mockDetailResponse)
    const { result } = renderHook(() => useCollaborator(1), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApi.get).toHaveBeenCalledWith('/collaborators/1/')
    expect(result.current.data?.fullName).toBe('Carlos Tanaka')
    expect(result.current.data?.dateHired).toBe('2024-01-15')
    expect(result.current.data?.permAcessInternet).toBe(true)
  })

  it('desabilita query quando id é null', () => {
    const { result } = renderHook(() => useCollaborator(null), { wrapper: createQueryWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateCollaborator', () => {
  it('envia POST com payload snake_case', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 10 } })
    const { result } = renderHook(() => useCreateCollaborator(), { wrapper: createQueryWrapper() })

    result.current.mutate({
      fullName: 'Novo', domainUser: 'novo', office: 'TI',
      status: true, fired: false, dateHired: '2025-01-01', dateFired: '',
      permAcessInternet: false, acessWifi: false, adminPrivilege: false,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/collaborators/', expect.objectContaining({
      full_name: 'Novo',
      domain_user: 'novo',
    }))
  })
})

describe('useUpdateCollaborator', () => {
  it('envia PUT com id e payload snake_case', async () => {
    mockApi.put.mockResolvedValue({ data: { id: 1 } })
    const { result } = renderHook(() => useUpdateCollaborator(), { wrapper: createQueryWrapper() })

    result.current.mutate({
      id: 1,
      data: {
        fullName: 'Atualizado', domainUser: 'atualizado', office: 'RH',
        status: true, fired: false, dateHired: '2025-01-01', dateFired: '',
        permAcessInternet: true, acessWifi: false, adminPrivilege: false,
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/collaborators/1/', expect.objectContaining({
      full_name: 'Atualizado',
      office: 'RH',
    }))
  })
})

describe('useDeleteCollaborator', () => {
  it('envia DELETE para o endpoint correto', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteCollaborator(), { wrapper: createQueryWrapper() })

    result.current.mutate(5)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/collaborators/5/')
  })
})
