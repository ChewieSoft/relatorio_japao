/**
 * Página de listagem de máquinas da JRC Brasil.
 *
 * Exibe tabela paginada com dados vindos da API via useMachines hook.
 * Inclui estados de carregamento, erro com retry e mensagem de lista vazia.
 */
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useMachines } from "@/hooks/useMachines";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Monitor, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

/** Ícone booleano para flags de criptografia e antivírus. */
const BoolIcon = ({ value }: { value: boolean }) =>
  value ? <Check className="w-4 h-4 text-status-active" /> : <X className="w-4 h-4 text-destructive" />;

const Machines = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useMachines(page);
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <AppLayout>
      <PageHeader title="Máquinas" subtitle="Inventário de computadores e notebooks" />

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map(m => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50">
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

export default Machines;
