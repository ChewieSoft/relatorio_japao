/**
 * Página de listagem de máquinas da JRC Brasil.
 *
 * Exibe tabela paginada com CRUD completo: criação via Sheet (painel lateral),
 * edição via Sheet com dados pré-preenchidos, exclusão com confirmação,
 * e busca textual server-side com debounce.
 */
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import MachineForm from "@/components/MachineForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useMachines, useMachine, useCreateMachine, useUpdateMachine, useDeleteMachine } from "@/hooks/useMachines";
import { useCrudPage } from "@/hooks/useCrudPage";
import type { MachineFormData } from "@/types/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Plus, Pencil, Trash2, Monitor, Laptop } from "lucide-react";

const PAGE_SIZE = 20;

/** Ícone booleano para flags de criptografia e antivírus. */
const BoolIcon = ({ value }: { value: boolean }) =>
  value ? <Check className="w-4 h-4 text-status-active" /> : <X className="w-4 h-4 text-destructive" />;

const Machines = () => {
  const createMutation = useCreateMachine();
  const updateMutation = useUpdateMachine();
  const deleteMutation = useDeleteMachine();

  const crud = useCrudPage<MachineFormData>({
    createMutation,
    updateMutation,
    deleteMutation,
    entityLabel: "Máquina",
  });

  const { data, isLoading, isError, refetch } = useMachines(crud.page, crud.search);
  const { data: editData } = useMachine(crud.editingId);
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <AppLayout>
      <PageHeader title="Máquinas" subtitle="Inventário de computadores e notebooks">
        <Button onClick={crud.handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Máquina
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput value={crud.search} onChange={crud.handleSearchChange} placeholder="Buscar por hostname, modelo, tag ou IP..." />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading && <TableSkeleton />}

        {isError && (
          <TableError message="Erro ao carregar máquinas." onRetry={() => refetch()} />
        )}

        {data && data.results.length === 0 && <TableEmpty />}

        {data && data.results.length > 0 && (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Service Tag</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-center">Criptografia</TableHead>
                  <TableHead className="text-center">Antivírus</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map(m => (
                  <TableRow key={m.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium font-mono text-xs">{m.hostname}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {m.machineType === "notebook" ? <Laptop className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        {m.machineType === "notebook" ? "Notebook" : "Desktop"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.model}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.serviceTag}</TableCell>
                    <TableCell className="font-mono text-xs">{m.ip}</TableCell>
                    <TableCell>{m.collaboratorName}</TableCell>
                    <TableCell className="text-center"><BoolIcon value={m.encrypted} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={m.antivirus} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => crud.handleEdit(m.id)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => crud.setDeletingEntity({ id: m.id, name: `${m.hostname} (${m.serviceTag})` })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {totalPages > 1 && (
              <TablePagination page={crud.page} totalPages={totalPages} onPageChange={crud.setPage} />
            )}
          </>
        )}
      </div>

      <MachineForm
        open={crud.formOpen && (crud.editingId === null || !!editData)}
        onOpenChange={crud.handleFormClose}
        onSave={crud.handleSave}
        initialData={crud.editingId !== null && editData ? editData : undefined}
        isLoading={crud.isSaving}
        serverErrors={crud.serverErrors}
      />

      <DeleteConfirmDialog
        open={!!crud.deletingEntity}
        onConfirm={crud.handleDelete}
        onCancel={() => crud.setDeletingEntity(null)}
        entityName={crud.deletingEntity?.name || ''}
        isLoading={crud.isDeleting}
      />
    </AppLayout>
  );
};

export default Machines;
