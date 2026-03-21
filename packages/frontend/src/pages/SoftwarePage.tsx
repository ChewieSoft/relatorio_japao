/**
 * Página de listagem de software da JRC Brasil.
 *
 * Exibe tabela paginada com dados vindos da API via useSoftware hook.
 * Inclui barra de uso de licenças, estados de carregamento e erro.
 */
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton, TableError, TableEmpty, TablePagination } from "@/components/TableStates";
import { useSoftware } from "@/hooks/useSoftware";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const PAGE_SIZE = 20;

const typeLabels: Record<string, string> = {
  perpetual: "Perpétua",
  subscription: "Assinatura",
  oem: "OEM",
};

const SoftwarePage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useSoftware(page);
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <AppLayout>
      <PageHeader title="Software" subtitle="Controle de licenças de software" />

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map(s => {
                  const usage = Math.round((s.inUse / s.quantity) * 100);
                  return (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50">
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
    </AppLayout>
  );
};

export default SoftwarePage;
