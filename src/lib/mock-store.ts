import { useSyncExternalStore } from "react";
import { exercises as baseExercises, patients as basePatients, type Patient } from "@/lib/arca-data";
import { exerciseDetails, type ExerciseDetail } from "@/lib/arca-data";

// Almacén en memoria del mockup. Se reemplazará por llamadas a la API REST.
type Exercise = (typeof baseExercises)[number];
let state = { patients: [...basePatients] as Patient[], exercises: [...baseExercises] as Exercise[] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };

export function useMockPatients() { return useSyncExternalStore(subscribe, () => state.patients, () => state.patients); }
export function useMockExercises() { return useSyncExternalStore(subscribe, () => state.exercises, () => state.exercises); }

export function addPatient(patient: Patient) { state = { ...state, patients: [patient, ...state.patients] }; emit(); }
export function addExercise(exercise: Omit<Exercise, "id">) {
  const id = Math.max(...state.exercises.map((item) => item.id)) + 1;
  state = { ...state, exercises: [...state.exercises, { ...exercise, id }] }; emit(); return id;
}
export function updateExercise(id: number, patch: Partial<Exercise>) {
  state = { ...state, exercises: state.exercises.map((item) => item.id === id ? { ...item, ...patch } : item) }; emit();
}

// Detalles clínicos de ejercicios (series, instrucciones, precauciones, video).

const customDetails: Record<number, ExerciseDetail & { video?: string | undefined }> = {};
export function exerciseDetailsFor(id: number): ExerciseDetail & { video?: string | undefined } {
  return customDetails[id] ?? exerciseDetails[id] ?? { muscleGroup: "Por definir", sets: 3, reps: 10, frequency: "3 días por semana", instructions: ["Realiza el movimiento de forma lenta y controlada."], precautions: ["Suspender si aparece dolor intenso."] };
}
export function setExerciseDetails(id: number, details: ExerciseDetail & { video?: string | undefined }) { customDetails[id] = details; }
