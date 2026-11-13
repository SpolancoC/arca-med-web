import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  // Solo el servidor local de desarrollo recibe credenciales de prueba.
  // No se incorporan al bundle creado con npm run build.
  const env =
    command === "serve" ? loadEnv(mode, process.cwd(), "ARCA_QUICK_") : {};
  const quickCredentials =
    command === "serve"
      ? {
          admin: {
            email: env.ARCA_QUICK_ADMIN_EMAIL || "",
            password: env.ARCA_QUICK_ADMIN_PASSWORD || "",
          },
          soporte: {
            email: env.ARCA_QUICK_SOPORTE_EMAIL || "",
            password: env.ARCA_QUICK_SOPORTE_PASSWORD || "",
          },
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
