/**
 * Entry point da aplicação React.
 *
 * Em ambiente de desenvolvimento, inicializa o MSW (Mock Service Worker)
 * para interceptar chamadas de rede antes de renderizar a aplicação.
 * Em produção, renderiza diretamente sem MSW.
 */
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

/**
 * Ativa MSW apenas em modo desenvolvimento.
 *
 * @returns Promise que resolve quando o worker está pronto (dev) ou imediatamente (prod).
 */
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser")
    return worker.start({ onUnhandledRequest: "bypass" })
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />)
})
