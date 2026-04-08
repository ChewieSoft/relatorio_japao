/**
 * Testes unitários para hooks de máquinas.
 *
 * Verifica listagem paginada com busca, detalhe para edição,
 * e mutations de criação, atualização e exclusão.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/wrapper'
import { useMachines, useMachine, useCreateMachine, useUpdateMachine, useDeleteMachine } from './useMachines'

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
      { id: 1, hostname: 'JRC-TI-001', model: 'Dell 7090', service_tag: 'ABC', ip: '192.168.1.1', mac_address: 'AA:BB:CC:DD:EE:01', operational_system: 'Win11', encrypted: true, antivirus: true, collaborator_id: 1, collaborator_name: 'Carlos', machine_type: 'desktop' },
    ],
  },
}

const mockDetailResponse = {
  data: {
    id: 1, hostname: 'JRC-TI-001', model: 'Dell 7090', type: 'desktop',
    service_tag: 'ABC', operacional_system: 'Win11', ram_memory: '16GB',
    disk_memory: '512GB', ip: '192.168.1.1', mac_address: 'AA:BB:CC:DD:EE:01',
    administrator: 'TI', cod_jdb: 'JDB-001', date_purchase: '2024-06-15T00:00:00Z',
    quantity: 1, crypto_disk: true, crypto_usb: false, crypto_memory_card: false,
    sold_out: false, date_sold_out: null,
  },
}

beforeEach(() => vi.clearAllMocks())

describe('useMachines', () => {
  it('busca lista e transforma snake_case para camelCase', async () => {
    mockApi.get.mockResolvedValue(mockListResponse)
    const { result } = renderHook(() => useMachines(1), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].serviceTag).toBe('ABC')
    expect(result.current.data?.results[0].machineType).toBe('desktop')
  })

  it('inclui search na URL', async () => {
    mockApi.get.mockResolvedValue(mockListResponse)
    renderHook(() => useMachines(1, 'dell'), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled())
    expect(mockApi.get).toHaveBeenCalledWith('/machines/?page=1&search=dell')
  })
})

describe('useMachine', () => {
  it('converte detalhe para MachineFormData', async () => {
    mockApi.get.mockResolvedValue(mockDetailResponse)
    const { result } = renderHook(() => useMachine(1), { wrapper: createQueryWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.serviceTag).toBe('ABC')
    expect(result.current.data?.datePurchase).toBe('2024-06-15')
    expect(result.current.data?.cryptoDisk).toBe(true)
  })
})

describe('useCreateMachine', () => {
  it('envia POST com payload snake_case', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 10 } })
    const { result } = renderHook(() => useCreateMachine(), { wrapper: createQueryWrapper() })

    result.current.mutate({
      hostname: 'NEW', model: 'Dell', type: 'desktop', serviceTag: 'XYZ',
      operacionalSystem: 'Win11', ramMemory: '8GB', diskMemory: '256GB',
      ip: '10.0.0.1', macAddress: 'AA:BB:CC:DD:EE:FF', administrator: 'TI',
      codJdb: 'JDB-999', datePurchase: '2025-01-01', quantity: 1,
      cryptoDisk: false, cryptoUsb: false, cryptoMemoryCard: false,
      soldOut: false, dateSoldOut: '',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.post).toHaveBeenCalledWith('/machines/', expect.objectContaining({
      service_tag: 'XYZ', operacional_system: 'Win11',
    }))
  })
})

describe('useUpdateMachine', () => {
  it('envia PUT com id correto', async () => {
    mockApi.put.mockResolvedValue({ data: { id: 1 } })
    const { result } = renderHook(() => useUpdateMachine(), { wrapper: createQueryWrapper() })

    result.current.mutate({
      id: 1,
      data: {
        hostname: 'UPD', model: 'Dell', type: 'notebook', serviceTag: 'ABC',
        operacionalSystem: 'Win11', ramMemory: '16GB', diskMemory: '512GB',
        ip: '10.0.0.1', macAddress: 'AA:BB:CC:DD:EE:FF', administrator: 'TI',
        codJdb: 'JDB-001', datePurchase: '2024-06-15', quantity: 1,
        cryptoDisk: true, cryptoUsb: false, cryptoMemoryCard: false,
        soldOut: false, dateSoldOut: '',
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.put).toHaveBeenCalledWith('/machines/1/', expect.objectContaining({ type: 'notebook' }))
  })
})

describe('useDeleteMachine', () => {
  it('envia DELETE para endpoint correto', async () => {
    mockApi.delete.mockResolvedValue({})
    const { result } = renderHook(() => useDeleteMachine(), { wrapper: createQueryWrapper() })
    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApi.delete).toHaveBeenCalledWith('/machines/3/')
  })
})
