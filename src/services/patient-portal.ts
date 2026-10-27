import { apiRequest } from "./api";
import type { Exercise } from "./exercises";

export function listPatientExercises(): Promise<Exercise[]> {
  return apiRequest<Exercise[]>("/ejercicios");
}
export function recordExercise(id: number, correcto: boolean, comentario: string) {
  return apiRequest<{ id: number; ejercicio_id: number; correcto: boolean; comentario: string | null }>(`/ejercicios/${id}/ejecucion`, {
    method: "POST", body: JSON.stringify({ correcto, comentario: comentario.trim() || null }),
  });
}
export function submitSymptom(descripcion: string) {
  return apiRequest<{id:number; descripcion:string}>("/sintomas", {method:"POST", body:JSON.stringify({descripcion})});
}
export function submitMetric(data: {articulacion:string; lado:string; angulo_minimo:number; angulo_maximo:number}) {
  return apiRequest<{id:number}>("/metricas", {method:"POST", body:JSON.stringify(data)});
}
export function uploadPatientDocument(file: File) {
  const body = new FormData(); body.append("archivo", file);
  return apiRequest<{id:number; nombre_archivo:string}>("/documentos", {method:"POST", body});
}
