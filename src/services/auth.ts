import { apiRequest } from "./api";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  rol: string;
};

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/inicio-sesion", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}
