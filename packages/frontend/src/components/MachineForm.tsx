/**
 * Formulário de máquina em Sheet (painel lateral, create/edit).
 *
 * Usa Sheet ao invés de Dialog devido à densidade de campos (18).
 * Modo dual: sem initialData = criação, com initialData = edição.
 * Campo condicional: dateSoldOut visível quando soldOut=true.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controla visibilidade do Sheet.
 * @param {function} props.onOpenChange - Callback para abrir/fechar.
 * @param {function} props.onSave - Callback com dados validados do formulário.
 * @param {MachineFormData} [props.initialData] - Dados para modo edição.
 * @param {boolean} props.isLoading - Desabilita submit durante mutação.
 * @param {Record<string, string[]>} [props.serverErrors] - Erros da API (snake_case).
 * @returns {JSX.Element} Sheet com formulário de máquina.
 */
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { MachineFormData } from "@/types/entities"
import { machineSchema } from "@/types/entities"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

/** Mapeamento snake_case (API) → camelCase (form) para erros server-side. */
const SERVER_FIELD_MAP: Record<string, keyof MachineFormData> = {
  service_tag: 'serviceTag',
  operacional_system: 'operacionalSystem',
  ram_memory: 'ramMemory',
  disk_memory: 'diskMemory',
  mac_address: 'macAddress',
  cod_jdb: 'codJdb',
  date_purchase: 'datePurchase',
  crypto_disk: 'cryptoDisk',
  crypto_usb: 'cryptoUsb',
  crypto_memory_card: 'cryptoMemoryCard',
  sold_out: 'soldOut',
  date_sold_out: 'dateSoldOut',
}

const DEFAULT_VALUES: MachineFormData = {
  hostname: '',
  model: '',
  type: 'desktop',
  serviceTag: '',
  operacionalSystem: '',
  ramMemory: '',
  diskMemory: '',
  ip: '',
  macAddress: '',
  administrator: '',
  codJdb: '',
  datePurchase: '',
  quantity: 1,
  cryptoDisk: false,
  cryptoUsb: false,
  cryptoMemoryCard: false,
  soldOut: false,
  dateSoldOut: '',
}

interface MachineFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: MachineFormData) => void
  initialData?: MachineFormData
  isLoading: boolean
  serverErrors?: Record<string, string[]>
}

const MachineForm = ({ open, onOpenChange, onSave, initialData, isLoading, serverErrors }: MachineFormProps) => {
  const isEdit = !!initialData
  const form = useForm<MachineFormData>({
    resolver: zodResolver(machineSchema),
    defaultValues: initialData || DEFAULT_VALUES,
  })

  const soldOut = form.watch('soldOut')

  useEffect(() => {
    if (open) {
      form.reset(initialData || DEFAULT_VALUES)
    }
  }, [open, initialData, form])

  useEffect(() => {
    if (!soldOut) {
      form.setValue('dateSoldOut', '')
    }
  }, [soldOut, form])

  useEffect(() => {
    if (serverErrors) {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        const formField = SERVER_FIELD_MAP[field] || field
        form.setError(formField as keyof MachineFormData, { message: messages[0] })
      })
    }
  }, [serverErrors, form])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Máquina' : 'Nova Máquina'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados da máquina.' : 'Preencha os dados para cadastrar uma nova máquina.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4">
            <FormField control={form.control} name="hostname" render={({ field }) => (
              <FormItem>
                <FormLabel>Hostname</FormLabel>
                <FormControl><Input placeholder="JRC-TI-001" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl><Input placeholder="Dell OptiPlex 7090" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="notebook">Notebook</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="serviceTag" render={({ field }) => (
              <FormItem>
                <FormLabel>Service Tag</FormLabel>
                <FormControl><Input placeholder="ABCD1234" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="operacionalSystem" render={({ field }) => (
              <FormItem>
                <FormLabel>Sistema Operacional</FormLabel>
                <FormControl><Input placeholder="Windows 11 Pro" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="ramMemory" render={({ field }) => (
                <FormItem>
                  <FormLabel>Memória RAM</FormLabel>
                  <FormControl><Input placeholder="16GB" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="diskMemory" render={({ field }) => (
                <FormItem>
                  <FormLabel>Disco</FormLabel>
                  <FormControl><Input placeholder="512GB SSD" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="ip" render={({ field }) => (
                <FormItem>
                  <FormLabel>IP</FormLabel>
                  <FormControl><Input placeholder="192.168.1.100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="macAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço MAC</FormLabel>
                  <FormControl><Input placeholder="AA:BB:CC:DD:EE:FF" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="administrator" render={({ field }) => (
                <FormItem>
                  <FormLabel>Administrador</FormLabel>
                  <FormControl><Input placeholder="TI" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="codJdb" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código JDB</FormLabel>
                  <FormControl><Input placeholder="JDB-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="datePurchase" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Compra</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <p className="text-sm font-medium text-muted-foreground pt-2">Criptografia</p>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="cryptoDisk" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">Disco</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="cryptoUsb" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">USB</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="cryptoMemoryCard" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="text-sm">Cartão</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="soldOut" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <FormLabel className="text-sm">Baixa Patrimonial</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            {soldOut && (
              <FormField control={form.control} name="dateSoldOut" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Baixa</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default MachineForm
