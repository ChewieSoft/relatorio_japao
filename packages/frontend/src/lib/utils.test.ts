/**
 * Testes unitários para utilitários de `lib/utils`.
 *
 * Cobre `formatDateBR`, a formatação de datas de calendário para exibição
 * em pt-BR (DD/mmm/YYYY), com foco na ausência do off-by-one de timezone.
 */
import { describe, it, expect } from 'vitest'
import { formatDateBR } from './utils'

describe('formatDateBR', () => {
  it('formata data ISO como DD/mmm/YYYY com mês abreviado em pt-BR', () => {
    expect(formatDateBR('2023-12-01')).toBe('01/dez/2023')
    expect(formatDateBR('2026-01-01')).toBe('01/jan/2026')
    expect(formatDateBR('2026-07-23')).toBe('23/jul/2026')
  })

  it('não recua um dia (à prova de timezone, sem new Date)', () => {
    // '2023-12-01' interpretado por new Date() seria meia-noite UTC e, em
    // UTC-3, exibiria 30/nov/2023. O parse por split evita esse off-by-one.
    expect(formatDateBR('2023-12-01')).toBe('01/dez/2023')
    expect(formatDateBR('2024-01-01')).toBe('01/jan/2024')
  })

  it('cobre todos os meses do ano', () => {
    const esperado = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez',
    ]
    esperado.forEach((abrev, i) => {
      const mes = String(i + 1).padStart(2, '0')
      expect(formatDateBR(`2025-${mes}-15`)).toBe(`15/${abrev}/2025`)
    })
  })

  it('ignora componente de hora, usando só a data', () => {
    expect(formatDateBR('2023-12-01T00:00:00Z')).toBe('01/dez/2023')
  })

  it('retorna string vazia para entrada vazia, nula ou indefinida', () => {
    expect(formatDateBR('')).toBe('')
    expect(formatDateBR(null)).toBe('')
    expect(formatDateBR(undefined)).toBe('')
  })

  it('retorna string vazia para formato inválido', () => {
    expect(formatDateBR('01/12/2023')).toBe('')
    expect(formatDateBR('2023-13-40')).toBe('')
    expect(formatDateBR('abc')).toBe('')
  })
})
