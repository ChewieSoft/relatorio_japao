/**
 * Página de listagem de software da JRC Brasil.
 *
 * Exibe tabela paginada com CRUD completo: criação via Dialog,
 * edição via Dialog com dados pré-preenchidos, exclusão com confirmação,
 * busca textual server-side com debounce e barra de uso de licenças.
 */
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import SoftwareForm from "@/components/SoftwareForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useSoftware, useSoftwareDetail, useCreateSoftware, useUpdateSoftware, useDeleteSoftware } from "@/hooks/useSoftware";
import { useCrudPage } from "@/hooks/useCrudPage";
import type { SoftwareFormData } from "@/types/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2 } from "lucide-react";

const PAGE_SIZE = 20;

/** Mapeamento de tipos de licença para labels PT-BR. */
const typeLabels: Record<string, string> = {
  perpetual: "Perpétua",
  subscription: "Assinatura",
  oem: "OEM",
};

const SoftwarePage = () => {
  const createMutation = useCreateSoftware();
  const updateMutation = useUpdateSoftware();
  const deleteMutation = useDeleteSoftware();

  const crud = useCrudPage<SoftwareFormData>({
    createMutation,
    updateMutation,
    deleteMutation,
    entityLabel: "Software",
  });

  const { data, isLoading, isError, refetch } = useSoftware(crud.page, crud.search);
  const { data: editData } = useSoftwareDetail(crud.editingId);
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  // Sincroniza a quantidade de itens exibidos nesta página com o ref interno
  // do hook para permitir que `handleDelete` volte de página ao remover o
  // último item de uma página > 1.
  crud.setCurrentPageItemCount(data?.results.length ?? 0);

  return (
    <AppLayout>
      <PageHeader title="Software" subtitle="Controle de licenças de software">
        <Button onClick={crud.handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Software
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput value={crud.search} onChange={crud.handleSearchChange} placeholder="Buscar por nome ou chave de licença..." />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading && <TableSkeleton />}

        {isError && (
          <TableError message="Erro ao carregar software." onRetry={() => refetch()} />
        )}

        {data && data.results.length === 0 && <TableEmpty />}

        {data && data.results.length > 0 && (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map(s => {
                  const usage = s.quantity > 0 ? Math.round((s.inUse / s.quantity) * 100) : 0;
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell>
                        <p className="font-medium">{s.softwareName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.licenseKey}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeLabels[s.licenseType]}</Badge>
                      </TableCell>
                      <TableCell className="w-48">
                        <div className="flex items-center gap-3">
                          <Progress value={usage} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {s.inUse}/{s.quantity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.expiresAt || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => crud.handleEdit(s.id)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => crud.setDeletingEntity({ id: s.id, name: s.softwareName || s.licenseKey })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>

            {totalPages > 1 && (
              <TablePagination page={crud.page} totalPages={totalPages} onPageChange={crud.setPage} />
            )}
          </>
        )}
      </div>

      <SoftwareForm
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

export default SoftwarePage;
