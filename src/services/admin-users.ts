import { apiRequest } from "./api";
import type { AdminUser, CreateAdminUser, UpdateAdminUser } from "./patients";

export type { AdminUser, CreateAdminUser, UpdateAdminUser };

export function listAdminUsers(role?: AdminUser["rol"]): Promise<AdminUser[]> {
  const query = role ? `?rol=${encodeURIComponent(role)}` : "";
  return apiRequest<AdminUser[]>(`/admin/usuarios${query}`);
}

export function createUser(payload: CreateAdminUser): Promise<AdminUser> {
  return apiRequest<AdminUser>("/admin/usuarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function editUser(id: number, payload: UpdateAdminUser): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
