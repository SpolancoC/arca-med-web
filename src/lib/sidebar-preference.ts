// Preferencia local de navegación, sin datos personales ni clínicos.
export type SidebarPreference = "expandido" | "contraido";
const KEY = "arca-med-sidebar-v1";
export const SIDEBAR_PREFERENCE_EVENT = "arca-med-sidebar-preference-change";

export function getSidebarPreference(): SidebarPreference {
  try {
    return localStorage.getItem(KEY) === "contraido" ? "contraido" : "expandido";
  } catch {
    return "expandido";
  }
}

export function setSidebarPreference(preference: SidebarPreference) {
  try { localStorage.setItem(KEY, preference); } catch { /* Persistencia opcional. */ }
  window.dispatchEvent(new CustomEvent(SIDEBAR_PREFERENCE_EVENT, { detail: preference }));
}
