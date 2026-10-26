import { apiRequest } from "./api";

export type AuditoriaLog = {
  id: number;
  usuario_id: number | null;
  rol: string;
  accion: string;
  usuario_afectado_id: number | null;
  detalle: string | null;
  ip: string | null;
  fecha: string;
};
export type AuditoriaVerificacion = {
  integra: boolean;
  total_revisados: number;
  id_con_error: number | null;
  motivo: string | null;
};
export type AuditoriaFiltros = {
  usuario_id?: number;
  usuario_afectado_id?: number;
  accion?: string;
  limite?: number;
};
export function listarAuditoria(filtros: AuditoriaFiltros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return apiRequest<AuditoriaLog[]>(`/auditoria/logs${qs ? `?${qs}` : ""}`);
}
export function verificarAuditoria() {
  return apiRequest<AuditoriaVerificacion>("/auditoria/verificar");
}
