/**
 * Layout principal da aplicação com sidebar responsiva.
 *
 * Desktop (md+): sidebar fixa à esquerda (w-64).
 * Mobile (<md): sidebar oculta, acessível via botão hamburger
 * que abre um Sheet drawer pela esquerda.
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Conteúdo da página a ser renderizado.
 * @returns {JSX.Element} Layout responsivo com sidebar e conteúdo.
 */
import { ReactNode, useState } from "react";
import { Menu, Shield } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 min-h-screen flex-shrink-0">
        <AppSidebar />
      </aside>

      {/* Sidebar mobile (Sheet drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold tracking-wide">JRC BRASIL</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
