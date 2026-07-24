/**
 * Formulário de colaborador em Dialog (create/edit).
 *
 * Modo dual: sem initialData = criação, com initialData = edição.
 * Validação client-side via zod, campos condicionais (dateFired
 * visível quando fired=true), erros server-side via setError.
 *
 * Invariante de negócio (espelha o backend `_apply_fired_invariant`):
 * colaborador desligado (fired=true) é sempre inativo — o switch "Ativo"
 * é forçado a false e desabilitado enquanto "Desligado" está ligado. A
 * invariante é aplicada tanto ao carregar um registro (reset) quanto ao
 * alternar "Desligado" em tempo real, para que dois registros desligados
 * carregados em sequência não exibam status inconsistente.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controla visibilidade do Dialog.
 * @param {function} props.onOpenChange - Callback para abrir/fechar.
 * @param {function} props.onSave - Callback com dados validados do formulário.
 * @param {CollaboratorFormData} [props.initialData] - Dados para modo edição.
 * @param {boolean} props.isLoading - Desabilita submit durante mutação.
 * @param {Record<string, string[]>} [props.serverErrors] - Erros da API (snake_case).
 * @returns {JSX.Element} Dialog com formulário de colaborador.
 */
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { CollaboratorFormData } from "@/types/entities"
import { collaboratorSchema } from "@/types/entities"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

/** Mapeamento snake_case (API) → camelCase (form) para erros server-side. */
const SERVER_FIELD_MAP: Record<string, keyof CollaboratorFormData> = {
  full_name: 'fullName',
  domain_user: 'domainUser',
  office: 'office',
  date_hired: 'dateHired',
  date_fired: 'dateFired',
}

const DEFAULT_VALUES: CollaboratorFormData = {
  fullName: '',
  domainUser: '',
  office: '',
  status: true,
  fired: false,
  dateHired: '',
  dateFired: '',
  permAcessInternet: false,
  acessWifi: false,
  adminPrivilege: false,
}

/**
 * Aplica a invariante "desligado ⇒ inativo" aos valores iniciais do formulário.
 *
 * Garante que ao carregar um colaborador já desligado o switch "Ativo" venha
 * como false, mesmo que o registro persistido traga status=true (dado legado).
 * Complementa o efeito de toggle em tempo real: como o reset roda a cada
 * troca de `initialData`, a invariante vale para o segundo registro desligado
 * carregado na mesma sessão, quando o boolean `fired` não muda entre eles.
 *
 * @param {CollaboratorFormData} values - Valores iniciais (registro ou defaults).
 * @returns {CollaboratorFormData} Valores com status coerente com `fired`.
 */
function withFiredInvariant(values: CollaboratorFormData): CollaboratorFormData {
  return values.fired ? { ...values, status: false } : values
}

interface CollaboratorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CollaboratorFormData) => void
  initialData?: CollaboratorFormData
  isLoading: boolean
  serverErrors?: Record<string, string[]>
}

const CollaboratorForm = ({ open, onOpenChange, onSave, initialData, isLoading, serverErrors }: CollaboratorFormProps) => {
  const isEdit = !!initialData
  const form = useForm<CollaboratorFormData>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: withFiredInvariant(initialData || DEFAULT_VALUES),
  })

  const fired = form.watch('fired')

  useEffect(() => {
    if (open) {
      form.reset(withFiredInvariant(initialData || DEFAULT_VALUES))
    }
  }, [open, initialData, form])

  useEffect(() => {
    if (!fired) {
      form.setValue('dateFired', '')
    }
  }, [fired, form])

  // Invariante de negocio: colaborador desligado e sempre inativo.
  useEffect(() => {
    if (fired) {
      form.setValue('status', false)
    }
  }, [fired, form])

  useEffect(() => {
    if (serverErrors) {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        const formField = SERVER_FIELD_MAP[field] || field
        form.setError(formField as keyof CollaboratorFormData, { message: messages[0] })
      })
    }
  }, [serverErrors, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados do colaborador.' : 'Preencha os dados para cadastrar um novo colaborador.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl><Input placeholder="João da Silva" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="domainUser" render={({ field }) => (
              <FormItem>
                <FormLabel>Usuário de Domínio</FormLabel>
                <FormControl><Input placeholder="joao.silva" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="office" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <FormControl><Input placeholder="TI" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="dateHired" render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Contratação</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">Ativo</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={fired} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="fired" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">Desligado</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {fired && (
              <FormField control={form.control} name="dateFired" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Desligamento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="permAcessInternet" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">Internet</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="acessWifi" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">WiFi</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="adminPrivilege" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">Admin</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CollaboratorForm
