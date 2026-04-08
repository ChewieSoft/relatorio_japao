/**
 * Campo de busca reutilizável com debounce.
 *
 * Aplica debounce de 400ms para evitar requisições excessivas
 * durante a digitação (FR-012). Usa ícone de busca como indicador visual.
 * Reutilizado nas páginas de Collaborators, Machines e Software.
 *
 * @param {Object} props
 * @param {string} props.value - Valor atual da busca (controlado externamente).
 * @param {function} props.onChange - Callback com valor debounced.
 * @param {string} [props.placeholder] - Texto placeholder do campo.
 * @returns {JSX.Element} Campo de busca renderizado.
 */
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const DEBOUNCE_MS = 400

const SearchInput = ({ value, onChange, placeholder = "Buscar..." }: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}

export default SearchInput
