/**
 * Página de listagem de colaboradores da JRC Brasil.
 *
 * Exibe tabela paginada com CRUD completo: criação via Dialog,
 * edição via Dialog com dados pré-preenchidos, exclusão com confirmação,
 * e busca textual server-side com debounce.
 */
import { useState } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import SearchInput from "@/components/SearchInput";
import CollaboratorForm from "@/components/CollaboratorForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useCollaborators, useCollaborator, useCreateCollaborator, useUpdateCollaborator, useDeleteCollaborator } from "@/hooks/useCollaborators";
import type { CollaboratorFormData } from "@/types/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, Pencil, Trash2 } from "lucide-react";

const PAGE_SIZE = 20;

/** Ícone booleano para flags de acesso. */
const BoolIcon = ({ value }: { value: boolean }) =>
  value ? <Check className="w-4 h-4 text-status-active" /> : <X className="w-4 h-4 text-status-inactive" />;

const Collaborators = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingCollaborator, setDeletingCollaborator] = useState<{ id: number; name: string } | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>();

  const { data, isLoading, isError, refetch } = useCollaborators(page, search);
  const { data: editData } = useCollaborator(editingId);
  const createMutation = useCreateCollaborator();
  const updateMutation = useUpdateCollaborator();
  const deleteMutation = useDeleteCollaborator();
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

  const handleSave = (formData: CollaboratorFormData) => {
    setServerErrors(undefined);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          setFormOpen(false);
          setEditingId(null);
          toast.success("Colaborador atualizado com sucesso!");
        },
        onError: (error) => {
          const axiosError = error as AxiosError<Record<string, string[]>>;
          if (axiosError.response?.status === 400 && axiosError.response.data) {
            setServerErrors(axiosError.response.data);
          } else {
            console.error("Erro ao atualizar colaborador:", error);
            toast.error("Erro ao atualizar colaborador.");
          }
        },
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormOpen(false);
          toast.success("Colaborador cadastrado com sucesso!");
        },
        onError: (error) => {
          const axiosError = error as AxiosError<Record<string, string[]>>;
          if (axiosError.response?.status === 400 && axiosError.response.data) {
            setServerErrors(axiosError.response.data);
          } else {
            console.error("Erro ao cadastrar colaborador:", error);
            toast.error("Erro ao cadastrar colaborador.");
          }
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingCollaborator) return;
    deleteMutation.mutate(deletingCollaborator.id, {
      onSuccess: () => {
        setDeletingCollaborator(null);
        toast.success("Colaborador excluído com sucesso!");
      },
      onError: (error) => {
        console.error("Erro ao excluir colaborador:", error);
        toast.error("Erro ao excluir colaborador.");
        setDeletingCollaborator(null);
      },
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <AppLayout>
      <PageHeader title="Colaboradores" subtitle="Cadastro de funcionários da JRC Brasil">
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Colaborador
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Buscar por nome ou domínio..." />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading && <TableSkeleton />}

        {isError && (
          <TableError message="Erro ao carregar colaboradores." onRetry={() => refetch()} />
        )}

        {data && data.results.length === 0 && <TableEmpty />}

        {data && data.results.length > 0 && (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Servidor</TableHead>
                  <TableHead className="text-center">ERP</TableHead>
                  <TableHead className="text-center">Internet</TableHead>
                  <TableHead className="text-center">Celular</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map(c => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{c.domainUser}</TableCell>
                    <TableCell>{c.department}</TableCell>
                    <TableCell><StatusBadge status={c.status ? "active" : "inactive"} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasServerAccess} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasErpAccess} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasInternetAccess} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasCellphone} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c.id)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingCollaborator({ id: c.id, name: c.name })}>
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

      <CollaboratorForm
        open={formOpen}
        onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingId(null); } }}
        onSave={handleSave}
        initialData={editingId && editData ? editData : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
        serverErrors={serverErrors}
      />

      <DeleteConfirmDialog
        open={!!deletingCollaborator}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCollaborator(null)}
        entityName={deletingCollaborator?.name || ''}
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
};

export default Collaborators;
