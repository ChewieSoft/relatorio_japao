/**
 * Cabeçalho padrão de página com título, subtítulo e ações.
 *
 * Renderiza título principal (h1), subtítulo opcional e slot para
 * botões de ação alinhados à direita.
 *
 * @param {Object} props
 * @param {string} props.title - Título principal da página.
 * @param {string} [props.subtitle] - Texto descritivo abaixo do título.
 * @param {ReactNode} [props.children] - Botões ou ações à direita do cabeçalho.
 * @returns {JSX.Element} Cabeçalho renderizado.
 */
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => (
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </div>
);

export default PageHeader;
