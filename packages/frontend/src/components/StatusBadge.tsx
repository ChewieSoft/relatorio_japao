/**
 * Badge de status com cor semântica para entidades do sistema.
 *
 * Exibe label traduzido em PT-BR com cores CSS variables
 * mapeadas ao status: ativo, inativo, pendente, gerado ou enviado.
 *
 * @param {Object} props
 * @param {"active"|"inactive"|"pending"|"generated"|"sent"} props.status - Status da entidade.
 * @returns {JSX.Element} Badge renderizado com cor e label apropriados.
 */
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "generated" | "sent";
}

const config: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-status-active/10 text-status-active" },
  inactive: { label: "Inativo", className: "bg-status-inactive/10 text-status-inactive" },
  pending: { label: "Pendente", className: "bg-status-warning/10 text-status-warning" },
  generated: { label: "Gerado", className: "bg-accent/10 text-accent" },
  sent: { label: "Enviado", className: "bg-status-active/10 text-status-active" },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, className } = config[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", className)}>
      {label}
    </span>
  );
};

export default StatusBadge;
