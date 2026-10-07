export const MOCK_AUTH_KEY = "Administrador ARCA";
export const MOCK_EMAIL = "admin@arcamed.com";
export const MOCK_PASSWORD = "Arcamed2026";

export function hasMockSession() {
  return window.localStorage.getItem(MOCK_AUTH_KEY) === "active";
}

export function createMockSession() {
  window.localStorage.setItem(MOCK_AUTH_KEY, "active");
}

export function clearMockSession() {
  window.localStorage.removeItem(MOCK_AUTH_KEY);
}
