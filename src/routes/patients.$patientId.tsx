import { useEffect, useState } from "react";
import { createFileRoute } from "@/lib/router";
import { FileText, Activity, AlertCircle } from "lucide-react";
import { Section, TriageBadge } from "@/components/arca/clinical";
import {
  getPatientSummary,
  getPatientSymptoms,
  getPatientDocuments,
  type PatientSummary,
  type PatientSymptom,
  type PatientDocument,
} from "@/services/patient-detail";

export const Route = createFileRoute("/patients/$patientId/")({
  component: PatientDetailPage,
});

type Priority = "High" | "Medium" | "Low";

function mapPriority(value: string): Priority | null {
  switch (value.trim().toLowerCase()) {
    case "alta":
    case "high":
      return "High";
    case "media":
    case "medium":
      return "Medium";
    case "baja":
    case "low":
      return "Low";
    default:
      return null;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleDateString("es-CL");
}

function PatientDetailPage() {
  const { patientId } = Route.useParams();
  const id = Number(patientId);

  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [summaryMissing, setSummaryMissing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setSummary(null);
    setSymptoms([]);
    setDocuments([]);
    setSummaryMissing(false);
    setErrors([]);

    if (!Number.isSafeInteger(id) || id <= 0) {
      setErrors(["El identificador del paciente no es válido."]);
      setLoading(false);
      return;
    }

    async function loadPatient() {
      const results = await Promise.allSettled([
        getPatientSummary(id),
        getPatientSymptoms(id),
        getPatientDocuments(id),
      ]);

      if (!active) return;

      const [summaryResult, symptomsResult, documentsResult] = results;
      const nextErrors: string[] = [];

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        const status = (summaryResult.reason as { status?: number })?.status;

        if (status === 404) {
          setSummaryMissing(true);
        } else {
          nextErrors.push("No se pudo consultar el resumen clínico.");
        }
      }

      if (symptomsResult.status === "fulfilled") {
        setSymptoms(symptomsResult.value);
      } else {
        nextErrors.push("No se pudieron consultar los síntomas.");
      }

      if (documentsResult.status === "fulfilled") {
        setDocuments(documentsResult.value);
      } else {
        nextErrors.push("No se pudieron consultar los documentos.");
      }

      setErrors(nextErrors);
      setLoading(false);
    }

    void loadPatient();

    return () => {
      active = false;
    };
  }, [id]);

  const priority = summary ? mapPriority(summary.urgencia_sugerida) : null;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase text-accent">
          Ficha clínica
        </p>

        <h1 className="mt-1 font-display text-3xl font-semibold">
          Paciente #{patientId}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Información clínica consultada desde FastAPI.
        </p>
      </header>

      {loading ? (
        <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
          Cargando información del paciente...
        </div>
      ) : (
        <>
          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/30 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4" />
                <p className="font-semibold">
                  Algunas consultas no se completaron
                </p>
              </div>

              {errors.map((error) => (
                <p key={error} className="mt-2 text-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          <Section title="Resumen clínico generado por IA">
            <div className="mt-4">
              {summary ? (
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {summary.resumen_generado || "No hay resumen disponible."}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {summaryMissing
                    ? "No existe un prediagnóstico registrado para este paciente."
                    : "Resumen clínico no disponible."}
                </p>
              )}
            </div>
          </Section>

          <Section title="Prioridad de triaje">
            <div className="mt-4">
              {priority ? (
                <TriageBadge priority={priority} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin prioridad disponible.
                </p>
              )}
            </div>
          </Section>

          <Section title="Diagnósticos diferenciales">
            <div className="mt-4 space-y-2">
              {summary?.diagnosticos_diferenciales?.length ? (
                summary.diagnosticos_diferenciales.map((diagnosis, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-border p-3 text-sm"
                  >
                    {typeof diagnosis === "string"
                      ? diagnosis
                      : JSON.stringify(diagnosis, null, 2)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay diagnósticos diferenciales disponibles.
                </p>
              )}
            </div>
          </Section>

          <Section title="Síntomas registrados">
            <div className="mt-4 space-y-3">
              {symptoms.length > 0 ? (
                symptoms.map((symptom) => (
                  <div
                    key={symptom.id}
                    className="rounded-md border border-border p-3"
                  >
                    <p className="text-sm">{symptom.descripcion}</p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(symptom.creado_en)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay síntomas disponibles.
                </p>
              )}
            </div>
          </Section>

          <Section title="Mediciones de movilidad">
            <div className="mt-4">
              {summary?.metricas_fisicas?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="pb-3">Articulación</th>
                        <th className="pb-3">Lado</th>
                        <th className="pb-3">Mínimo</th>
                        <th className="pb-3">Máximo</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {summary.metricas_fisicas.map((metric, index) => (
                        <tr key={index}>
                          <td className="py-3">{metric.articulacion}</td>
                          <td>{metric.lado || "—"}</td>
                          <td>{metric.angulo_minimo}°</td>
                          <td>{metric.angulo_maximo}°</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="size-4" />
                  No hay mediciones disponibles.
                </div>
              )}
            </div>
          </Section>

          <Section title="Documentos del paciente">
            <div className="mt-4 space-y-2">
              {documents.length > 0 ? (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center gap-3 rounded-md border border-border p-3"
                  >
                    <FileText className="size-4 text-primary" />

                    <div>
                      <p className="text-sm font-medium">
                        {document.nombre_archivo}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {formatDate(document.subido_en)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay documentos disponibles.
                </p>
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
