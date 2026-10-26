/** Normaliza texto para búsquedas sin distinción de tildes o mayúsculas. */
export function normalizeSearch(value: string | number | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}
