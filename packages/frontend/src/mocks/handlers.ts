/**
 * Barrel export de todos os handlers MSW.
 *
 * Centraliza a importação dos handlers de cada domínio
 * para uso no setupWorker do MSW.
 */
import { authHandlers } from './handlers/auth'
import { collaboratorsHandlers } from './handlers/collaborators'
import { machinesHandlers } from './handlers/machines'
import { softwareHandlers } from './handlers/software'
import { reportsHandlers } from './handlers/reports'
import { dashboardHandlers } from './handlers/dashboard'

export const handlers = [
  ...authHandlers,
  ...collaboratorsHandlers,
  ...machinesHandlers,
  ...softwareHandlers,
  ...reportsHandlers,
  ...dashboardHandlers,
]
