/**
 * Página de relatórios de auditoria da JRC Brasil.
 *
 * Lista os 19 relatórios agrupados por categoria, vindos da API
 * via useReportsList hook. Permite gerar relatórios (useMutation)
 * e fazer download em PDF ou Excel via blob.
 */
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { TableSkeleton, TableError } from "@/components/TableStates";
import { useReportsList, useGenerateReport, downloadReport } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const { data, isLoading, isError, refetch } = useReportsList();
  const generateMutation = useGenerateReport();

  /** Dispara geração de relatório via API. */
  const handleGenerate = (reportNumber: string, name: string) => {
    generateMutation.mutate(reportNumber, {
      onSuccess: () => toast.success(`Relatório "${name}" gerado com sucesso!`),
      onError: () => toast.error(`Erro ao gerar relatório "${name}".`),
    });
  };

  /** Faz download do relatório no formato especificado. */
  const handleDownload = async (reportNumber: string, format: 'pdf' | 'xlsx') => {
    try {
      await downloadReport(reportNumber, format);
    } catch {
      toast.error("Erro ao baixar relatório.");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader title="Relatórios" subtitle="Geração de relatórios de auditoria para a matriz" />
        <TableSkeleton rows={6} />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <PageHeader title="Relatórios" subtitle="Geração de relatórios de auditoria para a matriz" />
        <TableError message="Erro ao carregar relatórios." onRetry={() => refetch()} />
      </AppLayout>
    );
  }

  const reportsList = data?.results ?? [];
  const categories = [...new Set(reportsList.map(r => r.category))];

  return (
    <AppLayout>
      <PageHeader title="Relatórios" subtitle="Geração de relatórios de auditoria para a matriz" />

      <div className="space-y-8">
        {categories.map(cat => {
          const catReports = reportsList.filter(r => r.category === cat);
          return (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catReports.map(r => (
                  <div key={r.id} className="bg-card rounded-xl border border-border p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <span className="text-xs font-mono text-muted-foreground">#{r.number}</span>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <h3 className="text-sm font-semibold text-card-foreground mt-3">{r.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.nameJp}</p>
                      {r.lastGenerated && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Último: {new Date(r.lastGenerated).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant={r.status === "pending" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleGenerate(r.number, r.name)}
                        disabled={generateMutation.isPending}
                      >
                        {r.status === "pending" ? "Gerar" : "Regerar"}
                      </Button>
                      {r.status !== "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(r.number, 'pdf')}
                            aria-label={`Baixar ${r.name} como PDF`}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(r.number, 'xlsx')}
                            aria-label={`Baixar ${r.name} como Excel`}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Excel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Reports;
