import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  // El acceso rápido médico se habilita solo en desarrollo local.
  // ADVERTENCIA: las credenciales siguen siendo visibles para el navegador
  // de desarrollo; usar exclusivamente cuentas de prueba, nunca producción.
  const env = command === "serve" ? loadEnv(mode, process.cwd(), "ARCA_QUICK_") : {};
  const quickCredentials = command === "serve"
    ? {
        medico: {
          email: env.ARCA_QUICK_MEDICO_EMAIL || "",
          password: env.ARCA_QUICK_MEDICO_PASSWORD || "",
        },
      }
    : null;

  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    define: { __ARCA_DEV_QUICK_ACCESS__: JSON.stringify(quickCredentials) },
  };
});
