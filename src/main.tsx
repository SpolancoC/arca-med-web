import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initializeDisplayPreferences } from "@/lib/display-preferences";
import App from "./App.tsx";
import { initializeTheme } from "./lib/theme-preference";

initializeTheme();

initializeDisplayPreferences();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
