/**
 * Interfaces TypeScript das entidades do domínio JRC Brasil.
 *
 * Representam os dados no formato camelCase usado pelo frontend.
 * A transformação de snake_case (API) para camelCase acontece
 * nos hooks de React Query (camada boundary).
 */

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
