/**
 * Página de listagem de colaboradores da JRC Brasil.
 *
 * Exibe tabela paginada com CRUD completo: criação via Dialog,
 * edição via Dialog com dados pré-preenchidos, exclusão com confirmação,
 * e busca textual server-side com debounce.
 */
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import SearchInput from "@/components/SearchInput";
import CollaboratorForm from "@/components/CollaboratorForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useCollaborators, useCollaborator, useCreateCollaborator, useUpdateCollaborator, useDeleteCollaborator } from "@/hooks/useCollaborators";
import { useCrudPage } from "@/hooks/useCrudPage";
import type { CollaboratorFormData } from "@/types/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Plus, Pencil, Trash2 } from "lucide-react";

const PAGE_SIZE = 20;

/** Ícone booleano para flags de acesso. */
const BoolIcon = ({ value }: { value: boolean }) =>
  value ? <Check className="w-4 h-4 text-status-active" /> : <X className="w-4 h-4 text-status-inactive" />;

const Collaborators = () => {
  const createMutation = useCreateCollaborator();
  const updateMutation = useUpdateCollaborator();
  const deleteMutation = useDeleteCollaborator();

  const crud = useCrudPage<CollaboratorFormData>({
    createMutation,
    updateMutation,
    deleteMutation,
    entityLabel: "Colaborador",
  });

  const { data, isLoading, isError, refetch } = useCollaborators(crud.page, crud.search);
  const { data: editData } = useCollaborator(crud.editingId);
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <AppLayout>
      <PageHeader title="Colaboradores" subtitle="Cadastro de funcionários da JRC Brasil">
        <Button onClick={crud.handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Colaborador
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput value={crud.search} onChange={crud.handleSearchChange} placeholder="Buscar por nome ou domínio..." />
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
                        <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => crud.handleEdit(c.id)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => crud.setDeletingEntity({ id: c.id, name: c.name })}>
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

      <CollaboratorForm
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

export default Collaborators;
