/**
 * Página de listagem de máquinas da JRC Brasil.
 *
 * Exibe tabela paginada com CRUD completo: criação via Sheet (painel lateral),
 * edição via Sheet com dados pré-preenchidos, exclusão com confirmação,
 * e busca textual server-side com debounce.
 */
import { useState } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import MachineForm from "@/components/MachineForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useMachines, useMachine, useCreateMachine, useUpdateMachine, useDeleteMachine } from "@/hooks/useMachines";
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<{ id: number; name: string } | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>();

  const { data, isLoading, isError, refetch } = useMachines(page, search);
  const { data: editData } = useMachine(editingId);
  const createMutation = useCreateMachine();
  const updateMutation = useUpdateMachine();
  const deleteMutation = useDeleteMachine();
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  const handleCreate = () => {
    setEditingId(null);
    setServerErrors(undefined);
    setFormOpen(true);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setServerErrors(undefined);
    setFormOpen(true);
  };

  const handleSave = (formData: MachineFormData) => {
    setServerErrors(undefined);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          setFormOpen(false);
          setEditingId(null);
          toast.success("Máquina atualizada com sucesso!");
        },
        onError: (error) => {
          const axiosError = error as AxiosError<Record<string, string[]>>;
          if (axiosError.response?.status === 400 && axiosError.response.data) {
            setServerErrors(axiosError.response.data);
          } else {
            console.error("Erro ao atualizar máquina:", error);
            toast.error("Erro ao atualizar máquina.");
          }
        },
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormOpen(false);
          toast.success("Máquina cadastrada com sucesso!");
        },
        onError: (error) => {
          const axiosError = error as AxiosError<Record<string, string[]>>;
          if (axiosError.response?.status === 400 && axiosError.response.data) {
            setServerErrors(axiosError.response.data);
          } else {
            console.error("Erro ao cadastrar máquina:", error);
            toast.error("Erro ao cadastrar máquina.");
          }
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingMachine) return;
    deleteMutation.mutate(deletingMachine.id, {
      onSuccess: () => {
        setDeletingMachine(null);
        toast.success("Máquina excluída com sucesso!");
      },
      onError: (error) => {
        console.error("Erro ao excluir máquina:", error);
        toast.error("Erro ao excluir máquina.");
        setDeletingMachine(null);
      },
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <AppLayout>
      <PageHeader title="Máquinas" subtitle="Inventário de computadores e notebooks">
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Máquina
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Buscar por hostname, modelo, tag ou IP..." />
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
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m.id)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingMachine({ id: m.id, name: `${m.hostname} (${m.serviceTag})` })}>
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
              <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      <MachineForm
        open={formOpen}
        onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingId(null); } }}
        onSave={handleSave}
        initialData={editingId && editData ? editData : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
        serverErrors={serverErrors}
      />

      <DeleteConfirmDialog
        open={!!deletingMachine}
        onConfirm={handleDelete}
        onCancel={() => setDeletingMachine(null)}
        entityName={deletingMachine?.name || ''}
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
};

export default Machines;
