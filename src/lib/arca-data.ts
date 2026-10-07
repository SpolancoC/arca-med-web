export type Priority = "High" | "Medium" | "Low";

export type Patient = {
  id: string;
  name: string;
  initials: string;
  age: number;
  lastEvaluation: string;
  priority: Priority;
  condition: string;
  region: string;
  rom: string;
  status: string;
};

export const patients: Patient[] = [
  { id: "ARC-1048", name: "Rosa Martínez", initials: "RM", age: 54, lastEvaluation: "19 sep 2026", priority: "High", condition: "Artrosis de rodilla", region: "Rodilla izquierda", rom: "78° de flexión", status: "Revisión pendiente" },
  { id: "ARC-0982", name: "Javier Prieto", initials: "JP", age: 61, lastEvaluation: "17 sep 2026", priority: "High", condition: "Tendinopatía del manguito rotador", region: "Hombro derecho", rom: "118° de abducción", status: "Actualizar plan" },
  { id: "ARC-1124", name: "Lucía Cordero", initials: "LC", age: 47, lastEvaluation: "20 sep 2026", priority: "Medium", condition: "Dolor lumbar mecánico", region: "Columna lumbar", rom: "42° de flexión", status: "En revisión" },
  { id: "ARC-1077", name: "Daniel Gil", initials: "DG", age: 39, lastEvaluation: "15 sep 2026", priority: "Low", condition: "Esguince de muñeca", region: "Muñeca derecha", rom: "64° de extensión", status: "Mejorando" },
  { id: "ARC-1091", name: "Amelia Soto", initials: "AS", age: 58, lastEvaluation: "14 sep 2026", priority: "Medium", condition: "Pinzamiento de cadera", region: "Cadera izquierda", rom: "104° de flexión", status: "Seguimiento" },
];

export const evaluations = [
  { patient: "Lucía Cordero", date: "20 sep", region: "Columna lumbar", rom: "42° de flexión", status: "En revisión", priority: "Medium" as Priority },
  { patient: "Daniel Gil", date: "19 sep", region: "Muñeca derecha", rom: "64° de extensión", status: "Completada", priority: "Low" as Priority },
  { patient: "Javier Prieto", date: "18 sep", region: "Hombro derecho", rom: "118° de abducción", status: "Revisión pendiente", priority: "High" as Priority },
  { patient: "Amelia Soto", date: "18 sep", region: "Cadera izquierda", rom: "104° de flexión", status: "Completada", priority: "Medium" as Priority },
];

export const romMeasurements = [
  { date: "10 ago", value: 52 },
  { date: "21 ago", value: 58 },
  { date: "2 sep", value: 65 },
  { date: "11 sep", value: 71 },
  { date: "19 sep", value: 78 },
];

export const exercises = [
  { id: 1, name: "Deslizamiento de talón en decúbito", region: "Rodilla", description: "Flexión y extensión controlada de rodilla en una posición con apoyo.", difficulty: "Inicial", objective: "Movilidad", duration: "8 min", repetitions: "3 × 12", status: "Disponible" },
  { id: 2, name: "Contracción isométrica de cuádriceps", region: "Rodilla", description: "Activación de baja carga del cuádriceps sin movimiento articular.", difficulty: "Inicial", objective: "Activación", duration: "6 min", repetitions: "3 × 10", status: "Disponible" },
  { id: 3, name: "Flexión asistida de hombro", region: "Hombro", description: "Elevación asistida suave dentro de un rango cómodo.", difficulty: "Inicial", objective: "Movilidad", duration: "10 min", repetitions: "2 × 10", status: "Disponible" },
  { id: 4, name: "Deslizamiento escapular en pared", region: "Hombro", description: "Desarrolla el control escapular durante la elevación del miembro superior.", difficulty: "Intermedio", objective: "Control motor", duration: "8 min", repetitions: "3 × 8", status: "Disponible" },
  { id: 5, name: "Basculación pélvica lumbar", region: "Columna lumbar", description: "Movimiento lumbopélvico controlado en decúbito con rodillas flexionadas.", difficulty: "Inicial", objective: "Control motor", duration: "7 min", repetitions: "2 × 12", status: "Disponible" },
  { id: 6, name: "Puente con activación de abductores", region: "Cadera", description: "Fortalecimiento progresivo de la cadena posterior y la cadera lateral.", difficulty: "Intermedio", objective: "Fuerza", duration: "12 min", repetitions: "3 × 10", status: "Revisión clínica" },
];

// ---- Datos ampliados (mock, reemplazables por la API REST) ----

export type PatientProfile = {
  sex: string; birthDate: string; email: string; phone: string; nextReview: string;
  attentionReason: string; movement: string; target: number; history: { date: string; value: number }[];
};

export const patientProfiles: Record<string, PatientProfile> = {
  "ARC-1048": { sex: "Femenino", birthDate: "12 mar 1972", email: "rosa.martinez@correo.cl", phone: "+56 9 5812 4471", nextReview: "24 sep 2026", attentionReason: "Evaluación pendiente de revisión", movement: "Flexión de rodilla", target: 110, history: romMeasurements },
  "ARC-0982": { sex: "Masculino", birthDate: "03 jul 1965", email: "javier.prieto@correo.cl", phone: "+56 9 6234 1180", nextReview: "25 sep 2026", attentionReason: "Plan terapéutico pendiente de actualización", movement: "Abducción de hombro", target: 160, history: [{ date: "5 ago", value: 92 }, { date: "19 ago", value: 101 }, { date: "29 ago", value: 108 }, { date: "8 sep", value: 114 }, { date: "17 sep", value: 118 }] },
  "ARC-1124": { sex: "Femenino", birthDate: "22 nov 1978", email: "lucia.cordero@correo.cl", phone: "+56 9 7120 3398", nextReview: "23 sep 2026", attentionReason: "Resultado que requiere revisión del profesional", movement: "Flexión lumbar", target: 60, history: [{ date: "12 ago", value: 38 }, { date: "24 ago", value: 44 }, { date: "4 sep", value: 45 }, { date: "13 sep", value: 43 }, { date: "20 sep", value: 42 }] },
  "ARC-1077": { sex: "Masculino", birthDate: "09 feb 1987", email: "daniel.gil@correo.cl", phone: "+56 9 8845 0027", nextReview: "29 sep 2026", attentionReason: "Control próximo", movement: "Extensión de muñeca", target: 70, history: [{ date: "8 ago", value: 40 }, { date: "18 ago", value: 48 }, { date: "28 ago", value: 55 }, { date: "6 sep", value: 60 }, { date: "15 sep", value: 64 }] },
  "ARC-1091": { sex: "Femenino", birthDate: "30 may 1968", email: "amelia.soto@correo.cl", phone: "+56 9 5501 7762", nextReview: "26 sep 2026", attentionReason: "Seguimiento pendiente", movement: "Flexión de cadera", target: 120, history: [{ date: "4 ago", value: 96 }, { date: "15 ago", value: 101 }, { date: "26 ago", value: 104 }, { date: "5 sep", value: 104 }, { date: "14 sep", value: 104 }] },
};

export type EvaluationRecord = {
  id: string; patientId: string; type: string; joint: string; movement: string; date: string; time: string;
  value: number; status: string; professional: string; today?: boolean;
};

export const professionals = ["Dra. Elena Martín", "Klgo. Tomás Reyes", "Klga. Paula Fuentes"];

// Historial completo: una evaluación por cada medición de cada paciente.
export const evaluationRecords: EvaluationRecord[] = patients.flatMap((patient) => {
  const profile = patientProfiles[patient.id]!;
  return profile.history.map((point, index) => ({
    id: `EV-${patient.id.slice(4)}-${index + 1}`,
    patientId: patient.id,
    type: index === 0 ? "Evaluación inicial" : "Evaluación de rango de movimiento",
    joint: patient.region,
    movement: profile.movement,
    date: `${point.date} 2026`,
    time: ["09:10", "10:30", "11:45", "15:20", "16:40"][index]!,
    value: point.value,
    status: index === profile.history.length - 1 ? patient.status === "Mejorando" || patient.status === "Seguimiento" ? "Completada" : "Revisión pendiente" : "Completada",
    professional: professionals[index % professionals.length]!,
  }));
});

// Evaluaciones realizadas hoy (21 sep 2026).
export const todayEvaluations: EvaluationRecord[] = [
  { id: "EV-HOY-1", patientId: "ARC-1048", type: "Evaluación de rango de movimiento", joint: "Rodilla izquierda", movement: "Flexión de rodilla", date: "21 sep 2026", time: "08:40", value: 80, status: "Revisión pendiente", professional: "Dra. Elena Martín", today: true },
  { id: "EV-HOY-2", patientId: "ARC-1077", type: "Control de seguimiento", joint: "Muñeca derecha", movement: "Extensión de muñeca", date: "21 sep 2026", time: "09:15", value: 66, status: "Completada", professional: "Klgo. Tomás Reyes", today: true },
  { id: "EV-HOY-3", patientId: "ARC-0982", type: "Evaluación de rango de movimiento", joint: "Hombro derecho", movement: "Abducción de hombro", date: "21 sep 2026", time: "10:05", value: 121, status: "En revisión", professional: "Dra. Elena Martín", today: true },
  { id: "EV-HOY-4", patientId: "ARC-1091", type: "Control de seguimiento", joint: "Cadera izquierda", movement: "Flexión de cadera", date: "21 sep 2026", time: "11:30", value: 106, status: "Completada", professional: "Klga. Paula Fuentes", today: true },
];

export const allEvaluations = [...todayEvaluations, ...evaluationRecords];

export function patientHistory(patientId: string) {
  return allEvaluations.filter((item) => item.patientId === patientId).sort((a, b) => (a.today ? 1 : 0) - (b.today ? 1 : 0) || a.id.localeCompare(b.id));
}

export type ExerciseDetail = { muscleGroup: string; sets: number; reps: number; frequency: string; instructions: string[]; precautions: string[] };

export const exerciseDetails: Record<number, ExerciseDetail> = {
  1: { muscleGroup: "Isquiotibiales y cuádriceps", sets: 3, reps: 12, frequency: "5 días por semana", instructions: ["Recuéstate boca arriba con ambas piernas extendidas.", "Desliza el talón hacia los glúteos flexionando la rodilla.", "Mantén 2 segundos en el punto de mayor flexión cómoda.", "Regresa lentamente a la posición inicial."], precautions: ["Evitar dolor mayor a 4/10 durante el ejercicio.", "Suspender si aparece hinchazón posterior a la sesión."] },
  2: { muscleGroup: "Cuádriceps", sets: 3, reps: 10, frequency: "Diario", instructions: ["Siéntate con la pierna extendida y una toalla bajo la rodilla.", "Presiona la toalla contrayendo el muslo.", "Mantén la contracción 5 segundos.", "Relaja y repite."], precautions: ["No bloquear la respiración durante la contracción."] },
  3: { muscleGroup: "Deltoides y manguito rotador", sets: 2, reps: 10, frequency: "5 días por semana", instructions: ["Recuéstate boca arriba sosteniendo un bastón con ambas manos.", "Eleva los brazos con ayuda del lado sano.", "Detente en un rango cómodo y regresa lentamente."], precautions: ["No superar el umbral de dolor moderado.", "Evitar compensar con la columna."] },
  4: { muscleGroup: "Serrato anterior y trapecio", sets: 3, reps: 8, frequency: "4 días por semana", instructions: ["Apoya antebrazos en la pared a la altura de los hombros.", "Desliza los brazos hacia arriba manteniendo el contacto.", "Regresa controlando el descenso de las escápulas."], precautions: ["Mantener el cuello relajado.", "Detener si aparece dolor punzante."] },
  5: { muscleGroup: "Transverso abdominal y multífidos", sets: 2, reps: 12, frequency: "Diario", instructions: ["Recuéstate con rodillas flexionadas y pies apoyados.", "Aplana suavemente la zona lumbar contra el suelo.", "Mantén 3 segundos y relaja."], precautions: ["Movimiento de baja amplitud; evitar impulso."] },
  6: { muscleGroup: "Glúteo mayor y glúteo medio", sets: 3, reps: 10, frequency: "3 días por semana", instructions: ["Recuéstate con una banda elástica sobre las rodillas.", "Separa levemente las rodillas contra la banda.", "Eleva la pelvis hasta alinear tronco y muslos.", "Desciende de forma controlada."], precautions: ["Evitar hiperextensión lumbar.", "Progresar la resistencia solo si no hay dolor."] },
};

export const exerciseReviews = [
  { id: "RV-01", patientId: "ARC-1048", exerciseId: 1, assigned: "12 sep 2026", status: "Pendiente de revisión", reason: "El paciente reporta dolor 5/10 al finalizar la serie" },
  { id: "RV-02", patientId: "ARC-0982", exerciseId: 4, assigned: "10 sep 2026", status: "Pendiente de revisión", reason: "Compensación escapular detectada en el registro" },
  { id: "RV-03", patientId: "ARC-1091", exerciseId: 6, assigned: "8 sep 2026", status: "Requiere ajuste", reason: "Solicitud de progresión de carga" },
  { id: "RV-04", patientId: "ARC-1124", exerciseId: 5, assigned: "14 sep 2026", status: "Pendiente de revisión", reason: "Baja adherencia durante la última semana" },
];

export const doctorProfile = {
  name: "Dra. Elena Martín", initials: "EM", specialty: "Médica · Traumatología y rehabilitación", email: "elena@arcamed.cl",
  phone: "+56 9 5540 2231", license: "Registro SIS 204.518", clinic: "Centro ARCA Med Providencia", address: "Av. Providencia 1208, Santiago",
  schedule: "Lunes a viernes · 08:00 – 17:00",
};

export function profileFor(patientId: string): PatientProfile {
  return patientProfiles[patientId] ?? { sex: "—", birthDate: "—", email: "—", phone: "—", nextReview: "Por programar", attentionReason: "Evaluación inicial pendiente", movement: "Por definir", target: 0, history: [] };
}
