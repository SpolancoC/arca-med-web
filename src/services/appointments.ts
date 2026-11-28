import { apiRequest } from "./api";

export type AppointmentStatus = "programada" | "completada" | "cancelada";
export type Appointment = {
  id: number;
  paciente_id: number;
  paciente_nombre: string;
  especialidad_id: number;
  especialidad_nombre: string;
  articulaciones: string[];
  medico_id: number;
  medico_nombre: string;
  fecha_hora: string;
  duracion_minutos: number;
  motivo: string | null;
  estado: AppointmentStatus;
  preconsulta?: {
    disponible: boolean;
    sintomas_registrados: boolean;
    articulacion: string | null;
    lado: string | null;
    documentos: number;
    evaluaciones: number;
    enviada: boolean;
    enviada_en: string | null;
  };
};
export type CreateAppointment = {
  paciente_id: number;
  medico_id?: number;
  especialidad_id: number;
  fecha_hora: string;
  duracion_minutos: number;
  motivo?: string | null;
};
export type UpdateAppointment = Partial<Pick<CreateAppointment, "fecha_hora" | "duracion_minutos" | "motivo">> & { estado?: AppointmentStatus };

export type Specialty = { id: number; nombre: string; area: string; articulaciones: string[] };
export function listSpecialties(): Promise<Specialty[]> {
  return apiRequest<Specialty[]>("/especialidades");
}
export function listMyAppointments(onlyUpcoming = true): Promise<Appointment[]> {
  return apiRequest<Appointment[]>(`/mis-citas?solo_proximas=${onlyUpcoming}`);
}
export function listAppointments(filters: {desde?: string; hasta?: string; medico_id?: number; paciente_id?: number; estado?: AppointmentStatus} = {}): Promise<Appointment[]> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return apiRequest<Appointment[]>(`/citas${query.size ? `?${query}` : ""}`);
}
export function createAppointment(data: CreateAppointment): Promise<Appointment> {
  return apiRequest<Appointment>("/citas", {method: "POST", body: JSON.stringify(data)});
}
export function updateAppointment(id: number, data: UpdateAppointment): Promise<Appointment> {
  return apiRequest<Appointment>(`/citas/${id}`, {method: "PATCH", body: JSON.stringify(data)});
}

// Convierte la hora local elegida en un ISO con zona horaria (UTC), exigido por FastAPI.
export function localDateToISO(value: string): string {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) throw new Error("Selecciona una fecha y hora válidas.");
  return date.toISOString();
}
export function dateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function appointmentDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {dateStyle:"medium", timeStyle:"short"}).format(new Date(iso));
}
export function isSameLocalDay(iso: string, key: string): boolean {
  return dateTimeLocalValue(iso).slice(0,10) === key;
}
