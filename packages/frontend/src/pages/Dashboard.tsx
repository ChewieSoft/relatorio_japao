/**
 * Página de dashboard do sistema JRC Brasil.
 *
 * Exibe KPIs reais vindos da API via useDashboardStats,
 * lista de relatórios pendentes e concluídos via useReportsList,
 * e alertas de segurança (máquinas sem criptografia).
 */
import { Users, Monitor, Package, FileText, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useReportsList } from "@/hooks/useReports";

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: reportsData, isLoading: reportsLoading, isError: reportsError, refetch: refetchReports } = useReportsList();

  const isLoading = statsLoading || reportsLoading;
  const isError = statsError || reportsError;

  const kpis = stats ? [
    {
      label: "Colaboradores Ativos",
      value: stats.activeCollaborators,
      total: stats.totalCollaborators,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Máquinas Registradas",
      value: stats.totalMachines,
      icon: Monitor,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Licenças de Software",
      value: stats.totalSoftware,
      icon: Package,
      color: "text-status-warning",
      bgColor: "bg-status-warning/10",
    },
    {
      label: "Relatórios Pendentes",
      value: stats.pendingReports,
      total: stats.totalReports,
      icon: FileText,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ] : [];

  const reportsList = reportsData?.results ?? [];
  const pendingReports = reportsList.filter(r => r.status === "pending");
  const completedReports = reportsList.filter(r => r.status !== "pending");

  return (
    <AppLayout>
      <PageHeader title="Dashboard" subtitle="Visão geral do compliance de TI — JRC Brasil" />

      {isError && (
        <div className="p-8 text-center bg-card rounded-xl border border-border mb-8">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Erro ao carregar dados do dashboard.</p>
          <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchReports(); }}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : kpis.map(({ label, value, total, icon: Icon, color, bgColor }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                  {total !== undefined && (
                    <span className="text-xs text-muted-foreground">de {total}</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-card-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relatórios Pendentes */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            Relatórios Pendentes ({pendingReports.length})
          </h2>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : pendingReports.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.nameJp}</p>
                    </div>
                    <span className="text-xs text-status-warning font-medium">Pendente</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Relatórios Concluídos */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-status-active" />
            Relatórios Concluídos ({completedReports.length})
          </h2>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : completedReports.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.nameJp}</p>
                    </div>
                    <span className={cn("text-xs font-medium", r.status === "sent" ? "text-status-active" : "text-accent")}>
                      {r.status === "sent" ? "Enviado" : "Gerado"}
                    </span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Alertas de Segurança */}
        {stats && stats.machinesWithoutEncryption.length > 0 && (
          <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              Alertas de Segurança
            </h2>
            <p className="text-sm text-card-foreground">
              <strong>{stats.machinesWithoutEncryption.length}</strong> máquina(s) sem criptografia de disco:{" "}
              {stats.machinesWithoutEncryption.join(", ")}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
