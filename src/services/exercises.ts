import { apiRequest } from "./api";

export type Exercise = {
  id: number;
  nombre_ejercicio: string;
  descripcion: string | null;
  articulacion: string;
  imagen_url: string | null;
};

export type CreateExercise = {
  nombre_ejercicio: string;
  descripcion?: string | null;
  articulacion: string;
};

// Obtener todos los ejercicios o filtrar por articulación.
export function getExercises(articulacion?: string): Promise<Exercise[]> {
  const query = articulacion
    ? `?articulacion=${encodeURIComponent(articulacion)}`
    : "";

  return apiRequest<Exercise[]>(`/ejercicios${query}`);
}

// Crear un ejercicio en PostgreSQL mediante FastAPI.
export function createExercise(data: CreateExercise): Promise<Exercise> {
  return apiRequest<Exercise>("/ejercicios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Subir una imagen a un ejercicio existente.
export function uploadExerciseImage(
  exerciseId: number,
  file: File,
): Promise<Exercise> {
  const formData = new FormData();

  formData.append("archivo", file);

  return apiRequest<Exercise>(`/ejercicios/${exerciseId}/imagen`, {
    method: "POST",
    body: formData,
  });
}
