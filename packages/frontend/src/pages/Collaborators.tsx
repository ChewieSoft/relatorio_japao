/**
 * Página de listagem de colaboradores da JRC Brasil.
 *
 * Exibe tabela paginada com dados vindos da API via useCollaborators hook.
 * Inclui estados de carregamento, erro com retry e mensagem de lista vazia.
 */
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useCollaborators } from "@/hooks/useCollaborators";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";

const PAGE_SIZE = 20;

/** Ícone booleano para flags de acesso. */
const BoolIcon = ({ value }: { value: boolean }) =>
  value ? <Check className="w-4 h-4 text-status-active" /> : <X className="w-4 h-4 text-status-inactive" />;

const Collaborators = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useCollaborators(page);
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <AppLayout>
      <PageHeader title="Colaboradores" subtitle="Cadastro de funcionários da JRC Brasil" />

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{c.domainUser}</TableCell>
                    <TableCell>{c.department}</TableCell>
                    <TableCell><StatusBadge status={c.status ? "active" : "inactive"} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasServerAccess} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasErpAccess} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasInternetAccess} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.hasCellphone} /></TableCell>
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
    </AppLayout>
  );
};

export default Collaborators;
