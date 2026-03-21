/**
 * Componentes reutilizáveis para estados de tabelas de dados.
 *
 * Centraliza padrões visuais de loading (skeleton), erro com retry,
 * estado vazio e paginação, usados em Collaborators, Machines e Software.
 */
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Skeleton de carregamento para tabelas.
 *
 * Exibe linhas placeholder animadas enquanto dados são carregados.
 *
 * @param {Object} props
 * @param {number} [props.rows=5] - Quantidade de linhas skeleton a exibir.
 * @returns {JSX.Element} Área de loading com skeletons.
 */
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="p-6 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

interface TableErrorProps {
  message: string;
  onRetry: () => void;
}

/**
 * Estado de erro para tabelas com botão de retry.
 *
 * Exibe ícone de alerta, mensagem descritiva e botão para
 * tentar carregar os dados novamente.
 *
 * @param {Object} props
 * @param {string} props.message - Mensagem de erro exibida ao usuário.
 * @param {Function} props.onRetry - Callback disparado ao clicar em "Tentar novamente".
 * @returns {JSX.Element} Área de erro centralizada.
 */
export const TableError = ({ message, onRetry }: TableErrorProps) => (
  <div className="p-8 text-center">
    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
    <p className="text-sm text-muted-foreground mb-3">{message}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      Tentar novamente
    </Button>
  </div>
);

/**
 * Estado vazio para tabelas sem registros.
 *
 * Exibe mensagem centralizada quando a API retorna lista vazia.
 *
 * @param {Object} props
 * @param {string} [props.message="Nenhum registro encontrado."] - Mensagem exibida.
 * @returns {JSX.Element} Área de estado vazio centralizada.
 */
export const TableEmpty = ({
  message = "Nenhum registro encontrado.",
}: {
  message?: string;
}) => (
  <div className="p-8 text-center">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Paginação numérica para tabelas de dados.
 *
 * Exibe botões numerados com estado ativo e navegação
 * via callback. Inclui aria-labels para acessibilidade.
 *
 * @param {Object} props
 * @param {number} props.page - Página atual (1-indexed).
 * @param {number} props.totalPages - Total de páginas disponíveis.
 * @param {Function} props.onPageChange - Callback ao clicar em uma página.
 * @returns {JSX.Element} Barra de paginação com botões numerados.
 */
export const TablePagination = ({
  page,
  totalPages,
  onPageChange,
}: TablePaginationProps) => (
  <nav
    aria-label="Paginação"
    className="flex justify-center gap-1.5 p-4 border-t border-border"
  >
    {Array.from({ length: totalPages }).map((_, i) => (
      <button
        key={i}
        className={cn(
          "px-3 py-1 text-sm border rounded transition-colors",
          page === i + 1
            ? "bg-primary text-primary-foreground border-primary"
            : "hover:bg-muted"
        )}
        onClick={() => onPageChange(i + 1)}
        aria-label={`Ir para página ${i + 1}`}
        aria-current={page === i + 1 ? "page" : undefined}
      >
        {i + 1}
      </button>
    ))}
  </nav>
);
