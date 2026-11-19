// Preferencias de presentación: nunca se almacenan datos de pacientes.
import { useSyncExternalStore } from "react";
export type DateStyle = "dd/mm/aaaa" | "aaaa-mm-dd";
export type Density = "normal" | "compacta";
const DATE_KEY = "arca-med-date-style-v1";
const DENSITY_KEY = "arca-med-density-v1";
const EVENT = "arca-med-display-preferences";
const read = (key: string): string | null => {
  try { return typeof window !== "undefined" ? window.localStorage.getItem(key) : null; } catch { return null; }
};
export const getDateStyle = (): DateStyle => read(DATE_KEY) === "aaaa-mm-dd" ? "aaaa-mm-dd" : "dd/mm/aaaa";
export const getDensity = (): Density => read(DENSITY_KEY) === "compacta" ? "compacta" : "normal";
const notify = () => { if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT)); };
export function setDateStyle(style: DateStyle) {
  try { localStorage.setItem(DATE_KEY, style); } catch { /* sin almacenamiento */ }
  notify();
}
export function applyDensity(density: Density) {
  if (typeof document !== "undefined") document.documentElement.dataset.density = density;
}
export function setDensity(density: Density) {
  try { localStorage.setItem(DENSITY_KEY, density); } catch { /* sin almacenamiento */ }
  applyDensity(density);
  notify();
}
export function initializeDisplayPreferences() { applyDensity(getDensity()); }
function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  const onStorage = (ev: StorageEvent) => { if (ev.key === DATE_KEY || ev.key === DENSITY_KEY) { applyDensity(getDensity()); listener(); } };
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener("storage", onStorage); };
}
export function useDateStyle() { return useSyncExternalStore(subscribe, getDateStyle, () => "dd/mm/aaaa" as DateStyle); }
export function useDensity() { return useSyncExternalStore(subscribe, getDensity, () => "normal" as Density); }
// Para fechas ISO date-only evitamos el desfase de UTC en husos horarios como Chile.
function parse(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year,month,day] = value.split("-").map(Number);
    return new Date(year,month-1,day);
  }
  return new Date(value);
}
export function formatDisplayDate(value: string | Date | null | undefined, withTime = false, style: DateStyle = getDateStyle()): string {
  if (!value) return "Fecha no disponible";
  const date = parse(value);
  if (!Number.isFinite(date.getTime())) return "Fecha no disponible";
  const pad = (n: number) => String(n).padStart(2,"0");
  const yyyy = date.getFullYear(), mm = pad(date.getMonth()+1), dd = pad(date.getDate());
  const formatted = style === "aaaa-mm-dd" ? `${yyyy}-${mm}-${dd}` : `${dd}/${mm}/${yyyy}`;
  return withTime ? `${formatted} ${pad(date.getHours())}:${pad(date.getMinutes())}` : formatted;
}
