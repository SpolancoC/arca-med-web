import { apiRequest } from "./api";

export type RegisteredPatient = {
  id: number;
  nombre: string;
  email: string;
  rol: "paciente";
  activo: boolean;
};

export function getRegisteredPatients(): Promise<RegisteredPatient[]> {
  return apiRequest<RegisteredPatient[]>("/admin/usuarios?rol=paciente");
}
