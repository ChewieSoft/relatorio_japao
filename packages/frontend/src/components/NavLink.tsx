/**
 * Link de navegação com suporte a classes condicionais de rota ativa.
 *
 * Wrapper sobre react-router-dom NavLink que aceita classNames
 * separadas para estados ativo e pendente via props dedicadas.
 *
 * @param {Object} props
 * @param {string} [props.className] - Classe base aplicada sempre.
 * @param {string} [props.activeClassName] - Classe adicional quando a rota está ativa.
 * @param {string} [props.pendingClassName] - Classe adicional durante transição de rota.
 * @param {string} props.to - Caminho de destino do link.
 * @returns {JSX.Element} Link de navegação renderizado.
 */
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
