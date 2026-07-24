import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Carrega o `.env.local` da raiz do monorepo em `process.env` sem depender de
 * `dotenv`. Cada linha `KEY=VALUE` (ignorando comentários e linhas vazias) é
 * exposta ao processo de teste; variáveis já definidas no ambiente têm
 * precedência. As credenciais (`DJR_USERNAME`/`DJR_PASSWORD`) nunca são
 * versionadas — `.env.local` está no `.gitignore`.
 */
function loadRootEnv(): void {
  try {
    const envPath = resolve(__dirname, "../../.env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // Sem .env.local: o teste falha com mensagem clara ao exigir as credenciais.
  }
}

loadRootEnv();

// Porta do dev server usada pelo e2e. Padrão 8080 (setup do projeto); pode ser
// sobrescrita via E2E_PORT (ex.: quando 8080 está ocupado ou para casar com um
// origin liberado no CORS do backend).
const PORT = process.env.E2E_PORT || "8080";
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // Sobe apenas o frontend; o backend (:8000) deve estar no ar (docker-compose
  // up ou runserver) — é ele que expõe o DateField que o e2e exercita.
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: BASE_URL,
  },
});
