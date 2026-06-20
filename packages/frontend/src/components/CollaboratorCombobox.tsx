/**
 * Combobox pesquisável para selecionar um único colaborador (usuário).
 *
 * Busca colaboradores server-side conforme o usuário digita (debounce) e
 * permite selecionar um colaborador ou limpar a seleção. Usado no formulário
 * de máquina para atribuir o usuário responsável — a relação N:N
 * CollaboratorMachine é tratada como 1:1 nesta tela.
 *
 * A filtragem interna do cmdk é desativada (`shouldFilter={false}`) porque a
 * busca é feita na API; o componente apenas exibe os resultados retornados.
 *
 * É um `forwardRef` que repassa `ref` e as props de acessibilidade injetadas
 * pelo shadcn `FormControl` (`id`, `aria-describedby`, `aria-invalid`) ao botão
 * gatilho, garantindo associação correta com o `FormLabel` e o `FormMessage`.
 *
 * @param {Object} props
 * @param {number | null} props.value - ID do colaborador selecionado (null = nenhum).
 * @param {function} props.onChange - Callback com o novo ID, ou null ao limpar.
 * @param {string} [props.initialLabel] - Nome pré-selecionado (modo edição), exibido
 *   no gatilho enquanto o colaborador não aparecer nos resultados da busca.
 * @param {string} [props.id] - Injetado pelo FormControl; repassado ao gatilho.
 * @param {string} [props.aria-describedby] - Injetado pelo FormControl.
 * @param {boolean} [props.aria-invalid] - Injetado pelo FormControl.
 * @returns {JSX.Element} Botão com popover de busca de colaboradores.
 */
import { forwardRef, useEffect, useId, useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { useCollaborators } from "@/hooks/useCollaborators"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface CollaboratorComboboxProps {
  value: number | null
  onChange: (id: number | null) => void
  initialLabel?: string
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

const CollaboratorCombobox = forwardRef<HTMLButtonElement, CollaboratorComboboxProps>(
  ({ value, onChange, initialLabel, id, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid }, ref) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    // Rótulo exibido no gatilho; semeado pelo nome vindo da edição.
    const [selectedLabel, setSelectedLabel] = useState(initialLabel ?? "")
    const listboxId = useId()

    useEffect(() => {
      setSelectedLabel(initialLabel ?? "")
    }, [initialLabel])

    // Debounce da busca para evitar uma requisição por tecla.
    useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(search), 300)
      return () => clearTimeout(timer)
    }, [search])

    // Só busca quando o popover está aberto, evitando requisição desnecessária
    // a cada vez que o formulário de máquina é montado.
    const { data, isLoading } = useCollaborators(1, debouncedSearch, open)
    const collaborators = data?.results ?? []

    /** Abre/fecha o popover, limpando a busca ao fechar para não ficar "grudada". */
    const handleOpenChange = (nextOpen: boolean) => {
      if (!nextOpen) {
        setSearch("")
        setDebouncedSearch("")
      }
      setOpen(nextOpen)
    }

    /** Seleciona um colaborador, fecha o popover e atualiza o rótulo do gatilho. */
    const handleSelect = (collaboratorId: number, name: string) => {
      onChange(collaboratorId)
      setSelectedLabel(name)
      handleOpenChange(false)
    }

    /** Limpa a seleção (máquina sem usuário). */
    const handleClear = () => {
      onChange(null)
      setSelectedLabel("")
      handleOpenChange(false)
    }

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={open ? listboxId : undefined}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", value === null && "text-muted-foreground")}>
              {value !== null ? selectedLabel || "Colaborador selecionado" : "Selecione um usuário"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar colaborador..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList id={listboxId}>
              <CommandGroup>
                <CommandItem value="__none__" onSelect={handleClear}>
                  <X className={cn("mr-2 h-4 w-4", value === null ? "opacity-100" : "opacity-0")} />
                  Nenhum (limpar)
                </CommandItem>
                {collaborators.map((collaborator) => (
                  <CommandItem
                    key={collaborator.id}
                    value={String(collaborator.id)}
                    onSelect={() => handleSelect(collaborator.id, collaborator.name)}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === collaborator.id ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{collaborator.name}</span>
                    {collaborator.department && (
                      <span className="ml-auto pl-2 text-xs text-muted-foreground">
                        {collaborator.department}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {isLoading && (
                <div className="py-3 text-center text-sm text-muted-foreground">Carregando...</div>
              )}
              {!isLoading && collaborators.length === 0 && (
                <div className="py-3 text-center text-sm text-muted-foreground">
                  Nenhum colaborador encontrado.
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)

CollaboratorCombobox.displayName = "CollaboratorCombobox"

export default CollaboratorCombobox
