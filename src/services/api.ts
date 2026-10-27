const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("arca-med-token");

  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError("No se pudo conectar al servidor. Revisa tu conexión y que el backend esté iniciado.", 0);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const payload: unknown = await response.json();
      if (payload && typeof payload === "object" && "detail" in payload) {
        const value = (payload as { detail: unknown }).detail;
        detail = typeof value === "string"
          ? value
          : Array.isArray(value)
            ? value.map((item: { msg?: string; loc?: Array<string | number> }) =>
                `${item.loc?.slice(1).join(".") || "Campo"}: ${item.msg || "Dato inválido"}`
              ).join("; ")
            : "";
      }
    } catch { /* El servidor puede devolver una respuesta sin JSON. */ }

    const defaults: Record<number, string> = {
      401: "Tu sesión no es válida o ha expirado. Vuelve a iniciar sesión.",
      403: "No tienes permiso para realizar esta operación.",
      404: "El recurso solicitado no existe o ya no está disponible.",
      422: "Revisa los campos del formulario e inténtalo nuevamente.",
      500: "El servidor tuvo un problema. Inténtalo nuevamente más tarde.",
    };
    throw new ApiError(detail || defaults[response.status] || "No se pudo completar la solicitud.", response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
