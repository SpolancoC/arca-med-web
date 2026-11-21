import { apiRequest } from "@/services/api";

export interface PatientMetric {
  // El backend puede omitir lado en /resumen; la interfaz lo trata como opcional.
  lado?: string | null;
  // Disponible si el backend amplía MetricaResumen con la fecha real de medición.
  medido_en?: string | null;
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

/** Descarga un examen protegido usando la misma sesión que las consultas clínicas. */
export async function fetchPatientDocumentFile(patientId: number, documentId: number): Promise<Blob> {
  const token = localStorage.getItem("arca-med-token");
  if (!token) throw new Error("Inicia sesión como médico para abrir el examen.");

  const apiUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/pacientes/${patientId}/documentos/${documentId}/archivo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("No fue posible conectarse para abrir el examen.");
  }
  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    if (response.status === 403) throw new Error("No tienes autorización para ver este examen.");
    if (response.status === 404) throw new Error("El examen ya no está disponible.");
    throw new Error("No se pudo abrir el examen. Inténtalo nuevamente.");
  }
  return response.blob();
}
