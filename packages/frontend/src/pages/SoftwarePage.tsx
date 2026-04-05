/**
 * Página de listagem de software da JRC Brasil.
 *
 * Exibe tabela paginada com CRUD completo: criação via Dialog,
 * edição via Dialog com dados pré-preenchidos, exclusão com confirmação,
 * busca textual server-side com debounce e barra de uso de licenças.
 */
import { useState } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import SoftwareForm from "@/components/SoftwareForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useSoftware, useSoftwareDetail, useCreateSoftware, useUpdateSoftware, useDeleteSoftware } from "@/hooks/useSoftware";
import type { SoftwareFormData } from "@/types/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2 } from "lucide-react";

const PAGE_SIZE = 20;

const typeLabels: Record<string, string> = {
  perpetual: "Perpétua",
  subscription: "Assinatura",
  oem: "OEM",
};

const SoftwarePage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingSoftware, setDeletingSoftware] = useState<{ id: number; name: string } | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>();

  const { data, isLoading, isError, refetch } = useSoftware(page, search);
  const { data: editData } = useSoftwareDetail(editingId);
  const createMutation = useCreateSoftware();
  const updateMutation = useUpdateSoftware();
  const deleteMutation = useDeleteSoftware();
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

  const handleSave = (formData: SoftwareFormData) => {
    setServerErrors(undefined);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          setFormOpen(false);
          setEditingId(null);
          toast.success("Software atualizado com sucesso!");
        },
        onError: (error) => {
          const axiosError = error as AxiosError<Record<string, string[]>>;
          if (axiosError.response?.status === 400 && axiosError.response.data) {
            setServerErrors(axiosError.response.data);
          } else {
            console.error("Erro ao atualizar software:", error);
            toast.error("Erro ao atualizar software.");
          }
        },
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormOpen(false);
          toast.success("Software cadastrado com sucesso!");
        },
        onError: (error) => {
          const axiosError = error as AxiosError<Record<string, string[]>>;
          if (axiosError.response?.status === 400 && axiosError.response.data) {
            setServerErrors(axiosError.response.data);
          } else {
            console.error("Erro ao cadastrar software:", error);
            toast.error("Erro ao cadastrar software.");
          }
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingSoftware) return;
    deleteMutation.mutate(deletingSoftware.id, {
      onSuccess: () => {
        setDeletingSoftware(null);
        toast.success("Software excluído com sucesso!");
      },
      onError: (error) => {
        console.error("Erro ao excluir software:", error);
        toast.error("Erro ao excluir software.");
        setDeletingSoftware(null);
      },
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <AppLayout>
      <PageHeader title="Software" subtitle="Controle de licenças de software">
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Software
        </Button>
      </PageHeader>

      <div className="mb-4">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Buscar por nome ou chave de licença..." />
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
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(s.id)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingSoftware({ id: s.id, name: s.softwareName || s.licenseKey })}>
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
              <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      <SoftwareForm
        open={formOpen}
        onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditingId(null); } }}
        onSave={handleSave}
        initialData={editingId && editData ? editData : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
        serverErrors={serverErrors}
      />

      <DeleteConfirmDialog
        open={!!deletingSoftware}
        onConfirm={handleDelete}
        onCancel={() => setDeletingSoftware(null)}
        entityName={deletingSoftware?.name || ''}
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
};

export default SoftwarePage;
