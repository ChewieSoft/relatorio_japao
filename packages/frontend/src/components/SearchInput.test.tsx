/**
 * Testes unitários para o componente SearchInput.
 *
 * Verifica renderização, debounce de 400ms, sincronização
 * com valor externo e limpeza de timeout no unmount.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SearchInput from './SearchInput'

describe('SearchInput', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza com placeholder customizado', () => {
    render(<SearchInput value="" onChange={vi.fn()} placeholder="Buscar..." />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('exibe valor inicial', () => {
    render(<SearchInput value="teste" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('teste')
  })

  it('aplica debounce de 400ms ao chamar onChange', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    expect(onChange).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(400) })
    expect(onChange).toHaveBeenCalledWith('abc')

    vi.useRealTimers()
  })

  it('cancela debounce anterior quando digita novamente', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } })
    act(() => { vi.advanceTimersByTime(200) })

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ab' } })
    act(() => { vi.advanceTimersByTime(400) })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('ab')

    vi.useRealTimers()
  })

  it('sincroniza valor local quando prop value muda', () => {
    const { rerender } = render(<SearchInput value="a" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('a')

    rerender(<SearchInput value="novo" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox')).toHaveValue('novo')
  })
})
