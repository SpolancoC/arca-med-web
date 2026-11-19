// Preferencia visual local del navegador; no contiene información clínica.
export type ThemePreference = "claro" | "oscuro" | "sistema";
const KEY = "arca-med-theme-v1";
let media: MediaQueryList | null = null;

export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(KEY);
    return value === "claro" || value === "oscuro" || value === "sistema" ? value : "claro";
  } catch {
    return "claro";
  }
}

function applyTheme(preference: ThemePreference) {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  document.documentElement.classList.toggle("dark", preference === "oscuro" || (preference === "sistema" && prefersDark));
  document.documentElement.style.colorScheme = preference === "oscuro" || (preference === "sistema" && prefersDark) ? "dark" : "light";
}

export function setThemePreference(preference: ThemePreference) {
  try { localStorage.setItem(KEY, preference); } catch { /* El tema se aplica a esta sesión aunque no se pueda persistir. */ }
  applyTheme(preference);
}

export function initializeTheme() {
  applyTheme(getThemePreference());
  if (typeof window.matchMedia !== "function") return;
  media ??= window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    if (getThemePreference() === "sistema") applyTheme("sistema");
  });
}
