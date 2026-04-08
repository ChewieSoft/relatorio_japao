/**
 * Testes unitários para schemas Zod e funções de mapeamento de entidades.
 *
 * Cobre validação de formulários (collaborator, machine, software),
 * conversão camelCase↔snake_case e regras condicionais.
 */
import { describe, it, expect } from 'vitest'
import {
  collaboratorSchema,
  machineSchema,
  softwareSchema,
  toCollaborator,
  toCollaboratorPayload,
  toCollaboratorFormData,
  toMachine,
  toMachinePayload,
  toMachineFormData,
  toSoftware,
  toSoftwarePayload,
  toSoftwareFormData,
} from './entities'
import type {
  CollaboratorFormData,
  MachineFormData,
  SoftwareFormData,
} from './entities'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validCollaborator: CollaboratorFormData = {
  fullName: 'João da Silva',
  domainUser: 'jsilva',
  office: 'TI',
  status: true,
  fired: false,
  dateHired: '2024-01-15',
  dateFired: '',
  permAcessInternet: true,
  acessWifi: false,
  adminPrivilege: false,
}

const validMachine: MachineFormData = {
  hostname: 'JRC-TI-001',
  model: 'Dell OptiPlex 7090',
  type: 'desktop',
  serviceTag: 'ABCD1234',
  operacionalSystem: 'Windows 11 Pro',
  ramMemory: '16GB',
  diskMemory: '512GB SSD',
  ip: '192.168.1.100',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  administrator: 'TI',
  codJdb: 'JDB-001',
  datePurchase: '2024-06-15',
  quantity: 1,
  cryptoDisk: true,
  cryptoUsb: false,
  cryptoMemoryCard: false,
  soldOut: false,
  dateSoldOut: '',
}

const validSoftware: SoftwareFormData = {
  softwareName: 'Microsoft Office 365',
  key: 'XXXXX-XXXXX-XXXXX',
  typeLicence: 'subscription',
  quantity: 50,
  quantityPurchase: 50,
  onUse: 38,
  departament: 'TI',
  lastPurchaseDate: '2024-01-01',
  expiresAt: '2026-12-31',
  observation: '',
}

// ---------------------------------------------------------------------------
// Collaborator Schema
// ---------------------------------------------------------------------------

describe('collaboratorSchema', () => {
  it('aceita dados válidos', () => {
    const result = collaboratorSchema.safeParse(validCollaborator)
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = collaboratorSchema.safeParse({ ...validCollaborator, fullName: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita domainUser vazio', () => {
    const result = collaboratorSchema.safeParse({ ...validCollaborator, domainUser: '' })
    expect(result.success).toBe(false)
  })

  it('exige dateFired quando fired=true', () => {
    const result = collaboratorSchema.safeParse({
      ...validCollaborator,
      fired: true,
      dateFired: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('dateFired')
    }
  })

  it('aceita fired=true com dateFired preenchida', () => {
    const result = collaboratorSchema.safeParse({
      ...validCollaborator,
      fired: true,
      dateFired: '2025-06-01',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Machine Schema
// ---------------------------------------------------------------------------

describe('machineSchema', () => {
  it('aceita dados válidos', () => {
    const result = machineSchema.safeParse(validMachine)
    expect(result.success).toBe(true)
  })

  it('rejeita IP com formato textual', () => {
    const result = machineSchema.safeParse({ ...validMachine, ip: 'not-an-ip' })
    expect(result.success).toBe(false)
  })

  it('rejeita IP com octetos fora do range 0-255', () => {
    const result = machineSchema.safeParse({ ...validMachine, ip: '999.999.999.999' })
    expect(result.success).toBe(false)
  })

  it('rejeita MAC address inválido', () => {
    const result = machineSchema.safeParse({ ...validMachine, macAddress: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('aceita hostname vazio (campo opcional)', () => {
    const result = machineSchema.safeParse({ ...validMachine, hostname: '' })
    expect(result.success).toBe(true)
  })

  it('exige dateSoldOut quando soldOut=true', () => {
    const result = machineSchema.safeParse({
      ...validMachine,
      soldOut: true,
      dateSoldOut: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('dateSoldOut')
    }
  })

  it('rejeita tipo inválido', () => {
    const result = machineSchema.safeParse({ ...validMachine, type: 'server' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Software Schema
// ---------------------------------------------------------------------------

describe('softwareSchema', () => {
  it('aceita dados válidos', () => {
    const result = softwareSchema.safeParse(validSoftware)
    expect(result.success).toBe(true)
  })

  it('rejeita onUse maior que quantity', () => {
    const result = softwareSchema.safeParse({ ...validSoftware, onUse: 100, quantity: 50 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('onUse')
    }
  })

  it('exige expiresAt quando typeLicence=subscription', () => {
    const result = softwareSchema.safeParse({
      ...validSoftware,
      typeLicence: 'subscription',
      expiresAt: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('expiresAt')
    }
  })

  it('não exige expiresAt para licença perpétua', () => {
    const result = softwareSchema.safeParse({
      ...validSoftware,
      typeLicence: 'perpetual',
      expiresAt: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita quantidade negativa', () => {
    const result = softwareSchema.safeParse({ ...validSoftware, quantity: -1 })
    expect(result.success).toBe(false)
  })

  it('rejeita typeLicence fora do enum', () => {
    const result = softwareSchema.safeParse({ ...validSoftware, typeLicence: 'banana' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('typeLicence'))).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Mapping: Collaborator
// ---------------------------------------------------------------------------

describe('toCollaboratorPayload', () => {
  it('converte camelCase para snake_case', () => {
    const payload = toCollaboratorPayload(validCollaborator)
    expect(payload.full_name).toBe('João da Silva')
    expect(payload.domain_user).toBe('jsilva')
    expect(payload.perm_acess_internet).toBe(true)
  })

  it('formata datas com timezone UTC', () => {
    const payload = toCollaboratorPayload(validCollaborator)
    expect(payload.date_hired).toBe('2024-01-15T00:00:00Z')
  })

  it('envia date_fired null quando não demitido', () => {
    const payload = toCollaboratorPayload(validCollaborator)
    expect(payload.date_fired).toBeNull()
  })
})

describe('toCollaboratorFormData', () => {
  it('converte snake_case para camelCase', () => {
    const raw = {
      full_name: 'Carlos Tanaka',
      domain_user: 'ctanaka',
      office: 'Engenharia',
      status: true,
      fired: false,
      date_hired: '2024-01-15T00:00:00Z',
      date_fired: null,
      perm_acess_internet: true,
      acess_wifi: false,
      admin_privilege: false,
    }
    const form = toCollaboratorFormData(raw)
    expect(form.fullName).toBe('Carlos Tanaka')
    expect(form.domainUser).toBe('ctanaka')
    expect(form.dateHired).toBe('2024-01-15')
    expect(form.dateFired).toBe('')
    expect(form.permAcessInternet).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Mapping: Machine
// ---------------------------------------------------------------------------

describe('toMachinePayload', () => {
  it('converte camelCase para snake_case', () => {
    const payload = toMachinePayload(validMachine)
    expect(payload.service_tag).toBe('ABCD1234')
    expect(payload.operacional_system).toBe('Windows 11 Pro')
    expect(payload.mac_address).toBe('AA:BB:CC:DD:EE:FF')
    expect(payload.crypto_disk).toBe(true)
  })

  it('envia date_sold_out null quando não em baixa', () => {
    const payload = toMachinePayload(validMachine)
    expect(payload.date_sold_out).toBeNull()
  })
})

describe('toMachineFormData', () => {
  it('converte snake_case para camelCase', () => {
    const raw = {
      hostname: 'JRC-TI-001',
      model: 'Dell OptiPlex 7090',
      type: 'desktop',
      service_tag: 'ABCD1234',
      operacional_system: 'Windows 11 Pro',
      ram_memory: '16GB',
      disk_memory: '512GB SSD',
      ip: '192.168.1.100',
      mac_address: 'AA:BB:CC:DD:EE:FF',
      administrator: 'TI',
      cod_jdb: 'JDB-001',
      date_purchase: '2024-06-15T00:00:00Z',
      quantity: 1,
      crypto_disk: true,
      crypto_usb: false,
      crypto_memory_card: false,
      sold_out: false,
      date_sold_out: null,
    }
    const form = toMachineFormData(raw)
    expect(form.serviceTag).toBe('ABCD1234')
    expect(form.operacionalSystem).toBe('Windows 11 Pro')
    expect(form.datePurchase).toBe('2024-06-15')
    expect(form.cryptoDisk).toBe(true)
    expect(form.dateSoldOut).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Mapping: Software
// ---------------------------------------------------------------------------

describe('toSoftwarePayload', () => {
  it('converte camelCase para snake_case', () => {
    const payload = toSoftwarePayload(validSoftware)
    expect(payload.software_name).toBe('Microsoft Office 365')
    expect(payload.type_licence).toBe('subscription')
    expect(payload.quantity_purchase).toBe(50)
    expect(payload.on_use).toBe(38)
  })

  it('formata expires_at com UTC para subscription', () => {
    const payload = toSoftwarePayload(validSoftware)
    expect(payload.expires_at).toBe('2026-12-31T00:00:00Z')
  })

  it('envia expires_at null para licença perpétua', () => {
    const payload = toSoftwarePayload({ ...validSoftware, typeLicence: 'perpetual', expiresAt: '' })
    expect(payload.expires_at).toBeNull()
  })
})

describe('toSoftwareFormData', () => {
  it('converte snake_case para camelCase', () => {
    const raw = {
      software_name: 'AutoCAD 2024',
      key: 'YYYYY-YYYYY',
      type_licence: 'subscription',
      quantity: 10,
      quantity_purchase: 10,
      on_use: 8,
      departament: 'Engenharia',
      last_purchase_date: '2024-01-01T00:00:00Z',
      expires_at: '2026-06-30T00:00:00Z',
      observation: 'teste',
    }
    const form = toSoftwareFormData(raw)
    expect(form.softwareName).toBe('AutoCAD 2024')
    expect(form.typeLicence).toBe('subscription')
    expect(form.lastPurchaseDate).toBe('2024-01-01')
    expect(form.expiresAt).toBe('2026-06-30')
    expect(form.onUse).toBe(8)
  })

  it('coerce type_licence desconhecido para string vazia', () => {
    const form = toSoftwareFormData({
      software_name: 'X',
      key: 'k',
      type_licence: 'banana',
    })
    expect(form.typeLicence).toBe('')
  })
})

// ---------------------------------------------------------------------------
// List mappers — coerção segura de unknown
// ---------------------------------------------------------------------------

describe('toCollaborator (list mapper)', () => {
  it('converte registro bem-formado para Collaborator', () => {
    const raw = {
      id: 1,
      name: 'Carlos',
      domain_user: 'ctanaka',
      department: 'TI',
      status: true,
      fired: false,
      has_server_access: true,
      has_erp_access: false,
      has_internet_access: true,
      has_cellphone: false,
      email: 'c@jrc.com',
    }
    const result = toCollaborator(raw)
    expect(result.id).toBe(1)
    expect(result.name).toBe('Carlos')
    expect(result.domainUser).toBe('ctanaka')
    expect(result.hasServerAccess).toBe(true)
  })

  it('usa fallbacks seguros quando campos são null/undefined', () => {
    const result = toCollaborator({ id: 2 })
    expect(result.name).toBe('')
    expect(result.domainUser).toBe('')
    expect(result.department).toBe('')
    expect(result.status).toBe(false)
    expect(result.fired).toBe(false)
    expect(result.hasServerAccess).toBe(false)
    expect(result.hasErpAccess).toBe(false)
    expect(result.hasInternetAccess).toBe(false)
    expect(result.hasCellphone).toBe(false)
    expect(result.email).toBe('')
  })

  it('rejeita tipos inesperados usando fallback', () => {
    const result = toCollaborator({
      id: 'abc',
      name: 42,
      status: 'sim',
      has_server_access: 1,
    })
    expect(result.id).toBe(0)
    expect(result.name).toBe('')
    expect(result.status).toBe(false)
    expect(result.hasServerAccess).toBe(false)
  })
})

describe('toMachine (list mapper)', () => {
  it('converte registro bem-formado para Machine', () => {
    const raw = {
      id: 10,
      hostname: 'JRC-TI-001',
      model: 'Dell',
      service_tag: 'ABCD',
      ip: '10.0.0.1',
      mac_address: 'AA:BB:CC:DD:EE:FF',
      operational_system: 'Windows 11',
      encrypted: true,
      antivirus: false,
      collaborator_id: 3,
      collaborator_name: 'Maria',
      machine_type: 'notebook',
    }
    const result = toMachine(raw)
    expect(result.id).toBe(10)
    expect(result.machineType).toBe('notebook')
    expect(result.collaboratorId).toBe(3)
    expect(result.encrypted).toBe(true)
  })

  it('coerce machine_type desconhecido para "desktop"', () => {
    const result = toMachine({ id: 1, machine_type: 'server' })
    expect(result.machineType).toBe('desktop')
  })

  it('preserva collaboratorId como null quando ausente', () => {
    const result = toMachine({ id: 1 })
    expect(result.collaboratorId).toBeNull()
    expect(result.hostname).toBe('')
    expect(result.encrypted).toBe(false)
  })

  it('preserva collaboratorId como null quando não-numérico', () => {
    const result = toMachine({ id: 1, collaborator_id: 'X' })
    expect(result.collaboratorId).toBeNull()
  })
})

describe('toSoftware (list mapper)', () => {
  it('converte registro bem-formado para Software', () => {
    const raw = {
      id: 5,
      software_name: 'Office',
      license_key: 'KEY-1',
      license_type: 'subscription',
      quantity: 10,
      in_use: 7,
      expires_at: '2026-12-31',
    }
    const result = toSoftware(raw)
    expect(result.id).toBe(5)
    expect(result.licenseType).toBe('subscription')
    expect(result.inUse).toBe(7)
    expect(result.expiresAt).toBe('2026-12-31')
  })

  it('coerce license_type desconhecido para "perpetual"', () => {
    const result = toSoftware({ id: 1, license_type: 'trial' })
    expect(result.licenseType).toBe('perpetual')
  })

  it('preserva expiresAt como null quando ausente', () => {
    const result = toSoftware({ id: 1 })
    expect(result.expiresAt).toBeNull()
    expect(result.softwareName).toBe('')
    expect(result.quantity).toBe(0)
    expect(result.inUse).toBe(0)
  })
})
