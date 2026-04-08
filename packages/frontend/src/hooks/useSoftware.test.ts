/**
 * Testes unitários para hooks de software.
 *
 * Verifica listagem paginada com busca, detalhe para edição,
 * e mutations de criação, atualização e exclusão.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/wrapper'
import { useSoftware, useSoftwareDetail, useCreateSoftware, useUpdateSoftware, useDeleteSoftware } from './useSoftware'

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
    count: 1, next: null, previous: null,
    results: [
      { id: 1, software_name: 'Office 365', license_key: 'XXXXX', license_type: 'subscription', quantity: 50, in_use: 38, expires_at: '2026-12-31' },
    ],
  },
}

const mockDetailResponse = {
  data: {
    id: 1, software_name: 'Office 365', key: 'XXXXX', type_licence: 'subscription',
    quantity: 50, quantity_purchase: 50, on_use: 38, departament: 'TI',
    last_purchase_date: '2024-01-01T00:00:00Z', expires_at: '2026-12-31T00:00:00Z',
    observation: '',
  },
}

beforeEach(() => vi.clearAllMocks())

describe('useSoftware', () => {
  it('busca lista e transforma snake_case para camelCase', async () => {
    mockApi.get.mockResolvedValue(mockListResponse)
    const { result } = renderHook(() => useSoftware(1), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].softwareName).toBe('Office 365')
    expect(result.current.data?.results[0].licenseType).toBe('subscription')
    expect(result.current.data?.results[0].inUse).toBe(38)
  })

  it('inclui search na URL', async () => {
    mockApi.get.mockResolvedValue(mockListResponse)
    renderHook(() => useSoftware(1, 'office'), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled())
    expect(mockApi.get).toHaveBeenCalledWith('/software/?page=1&search=office')
  })
})

describe('useSoftwareDetail', () => {
  it('converte detalhe para SoftwareFormData', async () => {
    mockApi.get.mockResolvedValue(mockDetailResponse)
    const { result } = renderHook(() => useSoftwareDetail(1), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.softwareName).toBe('Office 365')
    expect(result.current.data?.typeLicence).toBe('subscription')
    expect(result.current.data?.lastPurchaseDate).toBe('2024-01-01')
    expect(result.current.data?.expiresAt).toBe('2026-12-31')
    expect(result.current.data?.onUse).toBe(38)
  })
})

describe('useCreateSoftware', () => {
  it('envia POST com payload snake_case', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 10 } })
    const { result } = renderHook(() => useCreateSoftware(), { wrapper: createQueryWrapper() })

    result.current.mutate({
      softwareName: 'Novo', key: 'KEY-123', typeLicence: 'perpetual',
      quantity: 10, quantityPurchase: 10, onUse: 0, departament: 'TI',
      lastPurchaseDate: '2025-01-01', expiresAt: '', observation: '',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/software/', expect.objectContaining({
      software_name: 'Novo', type_licence: 'perpetual',
    }))
  })
})

describe('useUpdateSoftware', () => {
  it('envia PUT com id correto', async () => {
    mockApi.put.mockResolvedValue({ data: { id: 1 } })
    const { result } = renderHook(() => useUpdateSoftware(), { wrapper: createQueryWrapper() })

    result.current.mutate({
      id: 1,
      data: {
        softwareName: 'Atualizado', key: 'KEY', typeLicence: 'subscription',
        quantity: 20, quantityPurchase: 20, onUse: 15, departament: 'TI',
        lastPurchaseDate: '2025-01-01', expiresAt: '2027-01-01', observation: 'teste',
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/software/1/', expect.objectContaining({
      software_name: 'Atualizado', on_use: 15,
    }))
  })
})

describe('useDeleteSoftware', () => {
  it('envia DELETE para endpoint correto', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteSoftware(), { wrapper: createQueryWrapper() })
    result.current.mutate(7)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/software/7/')
  })
})
