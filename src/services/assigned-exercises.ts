import { apiRequest } from "@/services/api";
import type { Exercise } from "@/services/exercises";

export type AssignedExercise = Exercise & {
  indicaciones: string | null;
  asignado_en: string;
};

// Las asignaciones pertenecen a la cita, no a la biblioteca general.
export function getAssignedExercises(appointmentId: number) {
  return apiRequest<AssignedExercise[]>(`/citas/${appointmentId}/ejercicios`);
}

// PUT reemplaza toda la asignación de la cita: enviar siempre la lista completa.
export function saveAssignedExercises(appointmentId: number, exerciseIds: number[]) {
  return apiRequest<AssignedExercise[]>(`/citas/${appointmentId}/ejercicios`, {
    method: "PUT",
    body: JSON.stringify({ ejercicios: exerciseIds.map(ejercicio_id => ({ ejercicio_id })) }),
  });
}

export function getMyAssignedExercises(appointmentId: number) {
  return apiRequest<AssignedExercise[]>(`/mis-citas/${appointmentId}/ejercicios`);
}

export function recordAssignedExercise(appointmentId: number, exerciseId: number, correcto: boolean, comentario: string) {
  return apiRequest<{ id: number }>(`/mis-citas/${appointmentId}/ejercicios/${exerciseId}/ejecucion`, {
    method: "POST", body: JSON.stringify({ correcto, comentario: comentario.trim() || null }),
  });
}

export type ExerciseExecution = {
  id: number;
  ejercicio_id: number;
  cita_id: number | null;
  correcto: boolean;
  comentario: string | null;
  ejecutado_en: string;
  nombre_ejercicio?: string | null;
  articulacion?: string | null;
};

export function getMyExerciseExecutions(appointmentId: number) {
  return apiRequest<ExerciseExecution[]>(`/mis-citas/${appointmentId}/ejecuciones`);
}

export function getDoctorExerciseExecutions(appointmentId: number) {
  return apiRequest<ExerciseExecution[]>(`/citas/${appointmentId}/ejecuciones`);
}
