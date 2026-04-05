/**
 * Interfaces TypeScript das entidades do domínio JRC Brasil.
 *
 * Representam os dados no formato camelCase usado pelo frontend.
 * A transformação de snake_case (API) para camelCase acontece
 * nos hooks de React Query (camada boundary).
 */

import { z } from 'zod'

/** Funcionário da JRC Brasil com dados de domínio e permissões. */
export interface Collaborator {
  id: number
  name: string
  domainUser: string
  department: string
  status: boolean
  fired: boolean
  hasServerAccess: boolean
  hasErpAccess: boolean
  hasInternetAccess: boolean
  hasCellphone: boolean
  email: string
}

/** Computador ou notebook registrado no inventário da JRC. */
export interface Machine {
  id: number
  hostname: string
  model: string
  serviceTag: string
  ip: string
  macAddress: string
  operationalSystem: string
  encrypted: boolean
  antivirus: boolean
  collaboratorId: number | null
  collaboratorName: string
  machineType: "desktop" | "notebook"
}

/** Licença de software gerenciada pela JRC. */
export interface Software {
  id: number
  softwareName: string
  licenseKey: string
  licenseType: "perpetual" | "subscription" | "oem"
  quantity: number
  inUse: number
  expiresAt: string | null
}

/** Relatório de auditoria exigido pela matriz japonesa. */
export interface Report {
  id: number
  number: string
  name: string
  nameJp: string
  category: string
  lastGenerated: string | null
  status: "pending" | "generated" | "sent"
}

/** Usuário autenticado do sistema. */
export interface User {
  id: number
  username: string
  email: string
  isStaff: boolean
}

/** Estatísticas consolidadas para o dashboard. */
export interface DashboardStats {
  activeCollaborators: number
  totalCollaborators: number
  totalMachines: number
  totalSoftware: number
  pendingReports: number
  totalReports: number
  machinesWithoutEncryption: string[]
}

// ---------------------------------------------------------------------------
// FormData types — campos camelCase usados pelo react-hook-form
// ---------------------------------------------------------------------------

/** Dados do formulário de colaborador (create/edit). */
export interface CollaboratorFormData {
  fullName: string
  domainUser: string
  office: string
  status: boolean
  fired: boolean
  dateHired: string
  dateFired: string
  permAcessInternet: boolean
  acessWifi: boolean
  adminPrivilege: boolean
}

/** Dados do formulário de máquina (create/edit). */
export interface MachineFormData {
  hostname: string
  model: string
  type: 'desktop' | 'notebook'
  serviceTag: string
  operacionalSystem: string
  ramMemory: string
  diskMemory: string
  ip: string
  macAddress: string
  administrator: string
  codJdb: string
  datePurchase: string
  quantity: number
  cryptoDisk: boolean
  cryptoUsb: boolean
  cryptoMemoryCard: boolean
  soldOut: boolean
  dateSoldOut: string
}

/** Dados do formulário de software (create/edit). */
export interface SoftwareFormData {
  softwareName: string
  key: string
  typeLicence: string
  quantity: number
  quantityPurchase: number
  onUse: number
  departament: string
  lastPurchaseDate: string
  expiresAt: string
  observation: string
}

// ---------------------------------------------------------------------------
// Zod schemas — validação client-side com campos condicionais
// ---------------------------------------------------------------------------

/** Schema de validação para formulário de colaborador. */
export const collaboratorSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório').max(255),
  domainUser: z.string().min(1, 'Usuário de domínio é obrigatório').max(255),
  office: z.string().min(1, 'Departamento é obrigatório').max(100),
  status: z.boolean(),
  fired: z.boolean(),
  dateHired: z.string().min(1, 'Data de contratação é obrigatória'),
  dateFired: z.string(),
  permAcessInternet: z.boolean(),
  acessWifi: z.boolean(),
  adminPrivilege: z.boolean(),
}).refine(
  (data) => !data.fired || data.dateFired.length > 0,
  { message: 'Data de demissão é obrigatória quando demitido', path: ['dateFired'] }
)

/** Schema de validação para formulário de máquina. */
export const machineSchema = z.object({
  hostname: z.string().max(255),
  model: z.string().min(1, 'Modelo é obrigatório').max(255),
  type: z.enum(['desktop', 'notebook'], { required_error: 'Tipo é obrigatório' }),
  serviceTag: z.string().min(1, 'Service Tag é obrigatório').max(100),
  operacionalSystem: z.string().min(1, 'Sistema operacional é obrigatório').max(100),
  ramMemory: z.string().min(1, 'Memória RAM é obrigatória').max(50),
  diskMemory: z.string().min(1, 'Disco é obrigatório').max(50),
  ip: z.string().min(1, 'IP é obrigatório').max(45)
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Formato de IP inválido'),
  macAddress: z.string().min(1, 'Endereço MAC é obrigatório').max(17)
    .regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, 'Formato de MAC inválido'),
  administrator: z.string().min(1, 'Administrador é obrigatório').max(255),
  codJdb: z.string().min(1, 'Código JDB é obrigatório').max(50),
  datePurchase: z.string().min(1, 'Data de compra é obrigatória'),
  quantity: z.number().min(1, 'Quantidade mínima é 1'),
  cryptoDisk: z.boolean(),
  cryptoUsb: z.boolean(),
  cryptoMemoryCard: z.boolean(),
  soldOut: z.boolean(),
  dateSoldOut: z.string(),
}).refine(
  (data) => !data.soldOut || data.dateSoldOut.length > 0,
  { message: 'Data de baixa é obrigatória quando em baixa patrimonial', path: ['dateSoldOut'] }
)

/** Schema de validação para formulário de software. */
export const softwareSchema = z.object({
  softwareName: z.string().max(255),
  key: z.string().min(1, 'Chave de licença é obrigatória').max(255),
  typeLicence: z.string().min(1, 'Tipo de licença é obrigatório').max(50),
  quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
  quantityPurchase: z.number().min(0, 'Quantidade comprada não pode ser negativa'),
  onUse: z.number().min(0, 'Quantidade em uso não pode ser negativa'),
  departament: z.string().min(1, 'Departamento é obrigatório').max(100),
  lastPurchaseDate: z.string().min(1, 'Data da última compra é obrigatória'),
  expiresAt: z.string(),
  observation: z.string(),
}).refine(
  (data) => data.onUse <= data.quantity,
  { message: 'Quantidade em uso não pode exceder a quantidade total', path: ['onUse'] }
).refine(
  (data) => data.typeLicence !== 'subscription' || data.expiresAt.length > 0,
  { message: 'Data de expiração é obrigatória para assinatura', path: ['expiresAt'] }
)

// ---------------------------------------------------------------------------
// Mapping helpers — camelCase (form) ↔ snake_case (API)
// ---------------------------------------------------------------------------

/** Converte dados do formulário de colaborador para payload snake_case da API. */
export function toCollaboratorPayload(data: CollaboratorFormData): Record<string, unknown> {
  return {
    full_name: data.fullName,
    domain_user: data.domainUser,
    office: data.office,
    status: data.status,
    fired: data.fired,
    date_hired: data.dateHired ? `${data.dateHired}T00:00:00Z` : null,
    date_fired: data.fired && data.dateFired ? `${data.dateFired}T00:00:00Z` : null,
    perm_acess_internet: data.permAcessInternet,
    acess_wifi: data.acessWifi,
    admin_privilege: data.adminPrivilege,
  }
}

/** Converte dados do formulário de máquina para payload snake_case da API. */
export function toMachinePayload(data: MachineFormData): Record<string, unknown> {
  return {
    hostname: data.hostname,
    model: data.model,
    type: data.type,
    service_tag: data.serviceTag,
    operacional_system: data.operacionalSystem,
    ram_memory: data.ramMemory,
    disk_memory: data.diskMemory,
    ip: data.ip,
    mac_address: data.macAddress,
    administrator: data.administrator,
    cod_jdb: data.codJdb,
    date_purchase: data.datePurchase ? `${data.datePurchase}T00:00:00Z` : null,
    quantity: data.quantity,
    crypto_disk: data.cryptoDisk,
    crypto_usb: data.cryptoUsb,
    crypto_memory_card: data.cryptoMemoryCard,
    sold_out: data.soldOut,
    date_sold_out: data.soldOut && data.dateSoldOut ? `${data.dateSoldOut}T00:00:00Z` : null,
  }
}

/** Converte dados do formulário de software para payload snake_case da API. */
export function toSoftwarePayload(data: SoftwareFormData): Record<string, unknown> {
  return {
    software_name: data.softwareName,
    key: data.key,
    type_licence: data.typeLicence,
    quantity: data.quantity,
    quantity_purchase: data.quantityPurchase,
    on_use: data.onUse,
    departament: data.departament,
    last_purchase_date: data.lastPurchaseDate ? `${data.lastPurchaseDate}T00:00:00Z` : null,
    expires_at: data.typeLicence === 'subscription' && data.expiresAt ? `${data.expiresAt}T00:00:00Z` : null,
    observation: data.observation,
  }
}

/** Coerce segura para string (protege contra null/undefined da API). */
function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/** Coerce segura para boolean (protege contra tipos inesperados da API). */
function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Coerce segura para number (protege contra tipos inesperados da API). */
function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

/** Converte resposta detail da API (snake_case) para CollaboratorFormData (camelCase). */
export function toCollaboratorFormData(raw: Record<string, unknown>): CollaboratorFormData {
  return {
    fullName: str(raw.full_name),
    domainUser: str(raw.domain_user),
    office: str(raw.office),
    status: bool(raw.status, true),
    fired: bool(raw.fired),
    dateHired: str(raw.date_hired).slice(0, 10),
    dateFired: str(raw.date_fired).slice(0, 10),
    permAcessInternet: bool(raw.perm_acess_internet),
    acessWifi: bool(raw.acess_wifi),
    adminPrivilege: bool(raw.admin_privilege),
  }
}

/** Converte resposta detail da API (snake_case) para MachineFormData (camelCase). */
export function toMachineFormData(raw: Record<string, unknown>): MachineFormData {
  const rawType = str(raw.type)
  return {
    hostname: str(raw.hostname),
    model: str(raw.model),
    type: rawType === 'notebook' ? 'notebook' : 'desktop',
    serviceTag: str(raw.service_tag),
    operacionalSystem: str(raw.operacional_system),
    ramMemory: str(raw.ram_memory),
    diskMemory: str(raw.disk_memory),
    ip: str(raw.ip),
    macAddress: str(raw.mac_address),
    administrator: str(raw.administrator),
    codJdb: str(raw.cod_jdb),
    datePurchase: str(raw.date_purchase).slice(0, 10),
    quantity: num(raw.quantity, 1),
    cryptoDisk: bool(raw.crypto_disk),
    cryptoUsb: bool(raw.crypto_usb),
    cryptoMemoryCard: bool(raw.crypto_memory_card),
    soldOut: bool(raw.sold_out),
    dateSoldOut: str(raw.date_sold_out).slice(0, 10),
  }
}

/** Converte resposta detail da API (snake_case) para SoftwareFormData (camelCase). */
export function toSoftwareFormData(raw: Record<string, unknown>): SoftwareFormData {
  return {
    softwareName: str(raw.software_name),
    key: str(raw.key),
    typeLicence: str(raw.type_licence),
    quantity: num(raw.quantity),
    quantityPurchase: num(raw.quantity_purchase),
    onUse: num(raw.on_use),
    departament: str(raw.departament),
    lastPurchaseDate: str(raw.last_purchase_date).slice(0, 10),
    expiresAt: str(raw.expires_at).slice(0, 10),
    observation: str(raw.observation),
  }
}
