import { apiRequest } from "@/services/api";

export interface PatientMetric {
  // El backend puede omitir lado en /resumen; la interfaz lo trata como opcional.
  lado?: string | null;
  articulacion: string;
  angulo_maximo: number;
  angulo_minimo: number;
}

export interface PatientSummary {
  resumen_generado: string;
  diagnosticos_diferenciales: unknown[];
  urgencia_sugerida: string;
  metricas_fisicas: PatientMetric[];
}

export interface PatientSymptom {
  id: number;
  descripcion: string;
  creado_en: string;
}

export interface PatientDocument {
  id: number;
  nombre_archivo: string;
  tipo_archivo: string | null;
  subido_en: string;
}

export function getPatientSummary(id: number) {
  return apiRequest<PatientSummary>(`/pacientes/${id}/resumen`);
}

export function getPatientSymptoms(id: number) {
  return apiRequest<PatientSymptom[]>(`/pacientes/${id}/sintomas`);
}

export function getPatientDocuments(id: number) {
  return apiRequest<PatientDocument[]>(`/pacientes/${id}/documentos`);
}

export interface ReviewPatientSummaryResponse {
  id: number;
  revisado_por_medico: boolean;
}

export function reviewPatientSummary(id: number) {
  return apiRequest<ReviewPatientSummaryResponse>(
    `/pacientes/${id}/resumen/revisar`,
    {
      method: "POST",
      body: JSON.stringify({
        revisado_por_medico: true,
      }),
    },
  );
}
