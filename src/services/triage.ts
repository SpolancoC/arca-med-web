import { apiRequest } from "./api";

export type TriagePatient = {
  usuario_id: number;
  nombre: string;
  urgencia_sugerida: string;
};

export function getTriagePatients(): Promise<TriagePatient[]> {
  return apiRequest<TriagePatient[]>("/pacientes/triage");
}
