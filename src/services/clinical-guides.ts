import { apiRequest } from "./api";

export interface ClinicalGuide {
  id: number;
  titulo: string;
  contenido: string;
  creado_en: string;
}
export interface NewClinicalGuide { titulo: string; contenido: string; }
export interface CreatedClinicalGuide { id: number; titulo: string; }

export function listClinicalGuides() {
  return apiRequest<ClinicalGuide[]>("/guias-clinicas");
}
export function createClinicalGuide(data: NewClinicalGuide) {
  return apiRequest<CreatedClinicalGuide>("/guias-clinicas", {
    method: "POST", body: JSON.stringify(data),
  });
}
