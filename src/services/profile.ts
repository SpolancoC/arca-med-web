import { apiRequest } from "./api";

export type UserProfile = {
  id: number;
  nombre: string;
  rol: string;
};

export function getProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/perfil");
}
