import { apiRequest } from "./api";

export type UserProfile = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fecha_nacimiento: string | null;
  edad: number | null;
  sexo: string | null;
  telefono: string | null;
  foto_url: string | null;
};
export type ProfileChanges = {
  nombre?: string;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
};
export function getProfile(): Promise<UserProfile> { return apiRequest<UserProfile>("/perfil"); }
export function updateProfile(data: ProfileChanges): Promise<UserProfile> {
  return apiRequest<UserProfile>("/perfil", { method: "PATCH", body: JSON.stringify(data) });
}
export function uploadProfilePhoto(file: File): Promise<UserProfile> {
  const body = new FormData(); body.append("archivo", file);
  return apiRequest<UserProfile>("/perfil/foto", { method: "POST", body });
}
export function removeProfilePhoto(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/perfil/foto", { method: "DELETE" });
}
export async function fetchProfilePhoto(): Promise<string> {
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const token = localStorage.getItem("arca-med-token");
  const response = await fetch(`${base}/perfil/foto`, {headers: token ? {Authorization: `Bearer ${token}`} : {}});
  if (!response.ok) throw new Error("No se pudo obtener la foto de perfil.");
  return URL.createObjectURL(await response.blob());
}
