import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Proxy de desenvolvimento: encaminha /api ao backend Django, casando com
    // VITE_API_URL=/api do .env. Torna as chamadas same-origin (sem CORS) no
    // `npm run dev` e no e2e. Só vale para o dev server — `vite build` ignora.
    // Alvo configurável via VITE_DEV_API_PROXY (padrão: backend local :8000).
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
