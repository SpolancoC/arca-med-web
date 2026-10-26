import { apiRequest } from "./api";

export type RegisteredPatient = {
  id: number;
  nombre: string;
  email: string;
  rol: "paciente";
  activo: boolean;
};

export type AdminUser = {
  id: number;
  nombre: string;
  email: string;
  rol: "paciente" | "medico" | "admin";
  activo: boolean;
};

export type CreateAdminUser = {
  nombre: string;
  email: string;
  password: string;
  rol: "paciente" | "medico" | "admin";
};

export type UpdateAdminUser = Partial<
  Pick<AdminUser, "nombre" | "email" | "rol" | "activo">
> & {
  password?: string;
};

export type UpdatePatientData = {
  nombre?: string;
  email?: string;
  activo?: boolean;
};

export function getRegisteredPatients(): Promise<RegisteredPatient[]> {
  return apiRequest<RegisteredPatient[]>("/admin/usuarios?rol=paciente");
}

export function getAdminUser(id: number): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/usuarios/${id}`);
}

export function createAdminUser(data: CreateAdminUser): Promise<AdminUser> {
  return apiRequest<AdminUser>("/admin/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminUser(
  id: number,
  data: UpdateAdminUser,
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updatePatient(
  id: number,
  data: UpdatePatientData,
): Promise<RegisteredPatient> {
  return apiRequest<RegisteredPatient>(`/admin/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
