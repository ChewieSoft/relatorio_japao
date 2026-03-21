/**
 * Configuração do MSW Service Worker para desenvolvimento.
 *
 * Registra todos os handlers e configura o worker para
 * permitir requisições não interceptadas (bypass).
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
