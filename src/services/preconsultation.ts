import { apiRequest } from "./api";
import type { Appointment } from "./appointments";
export type PatientAppointment = Appointment;
export function getMyAppointments(): Promise<PatientAppointment[]> {return apiRequest<PatientAppointment[]>("/mis-citas?solo_proximas=false");}
export function savePreconsultationSymptoms(citaId:number, data:{descripcion:string;articulacion:string;lado?:"izquierdo"|"derecho"}){
  return apiRequest<unknown>(`/mis-citas/${citaId}/sintomas`,{method:"POST",body:JSON.stringify(data)});
}
export function uploadPreconsultationDocument(citaId:number, file:File){
  const body=new FormData();body.append("archivo",file);
  return apiRequest<unknown>(`/mis-citas/${citaId}/documentos`,{method:"POST",body});
}
export function savePreconsultationMetric(citaId:number,data:{angulo_minimo:number;angulo_maximo:number}){
  return apiRequest<unknown>(`/mis-citas/${citaId}/metricas`,{method:"POST",body:JSON.stringify(data)});
}
export function sendPreconsultation(citaId:number){return apiRequest<{cita_id:number;preconsulta_enviada_en:string}>(`/mis-citas/${citaId}/preconsulta/enviar`,{method:"POST"});}
