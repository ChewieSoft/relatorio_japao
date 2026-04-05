/**
 * Formulário de software em Dialog (create/edit).
 *
 * Modo dual: sem initialData = criação, com initialData = edição.
 * Campo condicional: expiresAt visível quando typeLicence='subscription'.
 * Validação client-side via zod, erros server-side via setError.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controla visibilidade do Dialog.
 * @param {function} props.onOpenChange - Callback para abrir/fechar.
 * @param {function} props.onSave - Callback com dados validados do formulário.
 * @param {SoftwareFormData} [props.initialData] - Dados para modo edição.
 * @param {boolean} props.isLoading - Desabilita submit durante mutação.
 * @param {Record<string, string[]>} [props.serverErrors] - Erros da API (snake_case).
 * @returns {JSX.Element} Dialog com formulário de software.
 */
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { SoftwareFormData } from "@/types/entities"
import { softwareSchema } from "@/types/entities"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

/** Mapeamento snake_case (API) → camelCase (form) para erros server-side. */
const SERVER_FIELD_MAP: Record<string, keyof SoftwareFormData> = {
  software_name: 'softwareName',
  type_licence: 'typeLicence',
  quantity_purchase: 'quantityPurchase',
  on_use: 'onUse',
  last_purchase_date: 'lastPurchaseDate',
  expires_at: 'expiresAt',
}

const DEFAULT_VALUES: SoftwareFormData = {
  softwareName: '',
  key: '',
  typeLicence: '',
  quantity: 0,
  quantityPurchase: 0,
  onUse: 0,
  departament: '',
  lastPurchaseDate: '',
  expiresAt: '',
  observation: '',
}

interface SoftwareFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: SoftwareFormData) => void
  initialData?: SoftwareFormData
  isLoading: boolean
  serverErrors?: Record<string, string[]>
}

const SoftwareForm = ({ open, onOpenChange, onSave, initialData, isLoading, serverErrors }: SoftwareFormProps) => {
  const isEdit = !!initialData
  const form = useForm<SoftwareFormData>({
    resolver: zodResolver(softwareSchema),
    defaultValues: initialData || DEFAULT_VALUES,
  })

  const typeLicence = form.watch('typeLicence')

  useEffect(() => {
    if (open) {
      form.reset(initialData || DEFAULT_VALUES)
    }
  }, [open, initialData, form])

  useEffect(() => {
    if (typeLicence !== 'subscription') {
      form.setValue('expiresAt', '')
    }
  }, [typeLicence, form])

  useEffect(() => {
    if (serverErrors) {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        const formField = SERVER_FIELD_MAP[field] || field
        form.setError(formField as keyof SoftwareFormData, { message: messages[0] })
      })
    }
  }, [serverErrors, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Software' : 'Novo Software'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados do software.' : 'Preencha os dados para cadastrar um novo software.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField control={form.control} name="softwareName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Software</FormLabel>
                <FormControl><Input placeholder="Microsoft Office 365" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="key" render={({ field }) => (
              <FormItem>
                <FormLabel>Chave de Licença</FormLabel>
                <FormControl><Input placeholder="XXXXX-XXXXX-XXXXX" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="typeLicence" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Licença</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="perpetual">Perpétua</SelectItem>
                      <SelectItem value="subscription">Assinatura</SelectItem>
                      <SelectItem value="oem">OEM</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="departament" render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl><Input placeholder="TI" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qtd. Total</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="quantityPurchase" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qtd. Comprada</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="onUse" render={({ field }) => (
                <FormItem>
                  <FormLabel>Em Uso</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="lastPurchaseDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Data da Última Compra</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {typeLicence === 'subscription' && (
              <FormField control={form.control} name="expiresAt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Expiração</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="observation" render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl><Textarea placeholder="Observações adicionais..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

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

export default SoftwareForm
