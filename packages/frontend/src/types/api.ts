/**
 * Tipos genéricos para respostas da API Django REST Framework.
 *
 * Define contratos de paginação e autenticação JWT
 * compartilhados por todos os hooks de data fetching.
 */

/** Resposta paginada padrão do DRF (PageNumberPagination). */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Par de tokens JWT retornado pelo endpoint de login. */
export interface TokenPair {
  access: string
  refresh: string
}
