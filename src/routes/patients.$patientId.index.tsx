import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { CalendarDays, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  head: () => ({
    meta: [{ title: "Ficha del paciente — ARCA Med" }],
  }),
  component: PatientDetail,
});

type Priority = "High" | "Medium" | "Low";

function getPriority(value: string): Priority | null {
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

function PatientDetail() {
  const { patientId } = Route.useParams();
  const id = Number(patientId);

  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryMissing, setSummaryMissing] = useState(false);

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Identificador de paciente inválido.");
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError(null);
    setSummary(null);
    setSummaryMissing(false);
    setSymptoms([]);
    setDocuments([]);

    async function loadPatient() {
      const results = await Promise.allSettled([
        getPatientSummary(id),
        getPatientSymptoms(id),
        getPatientDocuments(id),
      ]);

      if (!active) return;

      const [summaryResult, symptomsResult, documentsResult] = results;

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        const status = (summaryResult.reason as { status?: number })?.status;

        if (status === 404) {
          setSummaryMissing(true);
        } else {
          setError("No se pudo cargar el resumen clínico.");
        }
      }

      if (symptomsResult.status === "fulfilled") {
        setSymptoms(symptomsResult.value);
      } else {
        setError((current) =>
          current
            ? `${current} Tampoco se pudieron cargar los síntomas.`
            : "No se pudieron cargar los síntomas.",
        );
      }

      if (documentsResult.status === "fulfilled") {
        setDocuments(documentsResult.value);
      } else {
        setError((current) =>
          current
            ? `${current} Tampoco se pudieron cargar los documentos.`
            : "No se pudieron cargar los documentos.",
        );
      }

      setLoading(false);
    }

    void loadPatient();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cargando ficha clínica...
      </div>
    );
  }

  if (!Number.isSafeInteger(id) || id <= 0) {
    return <p className="text-destructive">{error}</p>;
  }

  const priority = summary ? getPriority(summary.urgencia_sugerida) : null;

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-border bg-card/75 p-5 shadow-clinical">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">
              Ficha clínica
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold">
              Paciente #{id}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Información obtenida desde ARCA Med
            </p>
          </div>

          <Button asChild variant="secondary">
            <Link to="/patients/$patientId/history" params={{ patientId }}>
              <CalendarDays className="size-4" />
              Ver historial
            </Link>
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Section title="Síntomas registrados">
          <div className="mt-3 space-y-3 text-sm">
            {symptoms.length === 0 ? (
              <p className="text-muted-foreground">
                No hay síntomas disponibles.
              </p>
            ) : (
              symptoms.map((symptom) => (
                <div key={symptom.id} className="border-b border-border pb-2">
                  <p>{symptom.descripcion}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(symptom.creado_en).toLocaleDateString("es-CL")}
                  </p>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="Historia clínica">
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            No hay una historia clínica estructurada disponible en los endpoints
            actuales.
          </p>
        </Section>

        <Section title="Documentos relevantes">
          <div className="mt-3 space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay documentos disponibles.
              </p>
            ) : (
              documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-2 rounded-md border border-border p-3 text-sm"
                >
                  <FileText className="size-4 text-primary" />
                  <span>{document.nombre_archivo}</span>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>

      <Section
        title="Triaje"
        description="Prioridad sugerida por el sistema"
        action={priority ? <TriageBadge priority={priority} /> : undefined}
      >
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {summary
              ? `Urgencia sugerida: ${summary.urgencia_sugerida}`
              : summaryMissing
                ? "Este paciente no tiene un prediagnóstico disponible."
                : "No hay información de triaje disponible."}
          </p>

          <div className="flex gap-2 rounded-md border border-info-border bg-info-soft p-3 text-xs text-info">
            <Info className="size-4 shrink-0" />
            <p>
              El triaje es una herramienta de apoyo. La decisión clínica
              corresponde al profesional.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Resumen clínico generado por IA">
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {summary?.resumen_generado || "No hay resumen clínico disponible."}
        </p>
      </Section>

      <Section title="Diagnósticos diferenciales">
        <div className="mt-3 space-y-2">
          {summary?.diagnosticos_diferenciales.length ? (
            summary.diagnosticos_diferenciales.map((diagnosis, index) => (
              <div
                key={index}
                className="rounded-md border border-border p-3 text-sm"
              >
                {typeof diagnosis === "string"
                  ? diagnosis
                  : JSON.stringify(diagnosis)}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay diagnósticos diferenciales disponibles.
            </p>
          )}
        </div>
      </Section>

      <Section title="Rango de movimiento">
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="pb-3">Articulación</th>
                <th className="pb-3">Ángulo mínimo</th>
                <th className="pb-3">Ángulo máximo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary?.metricas_fisicas.map((metric, index) => (
                <tr key={index}>
                  <td className="py-3">{metric.articulacion}</td>
                  <td>{metric.angulo_minimo}°</td>
                  <td>{metric.angulo_maximo}°</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!summary?.metricas_fisicas.length && (
            <p className="py-4 text-sm text-muted-foreground">
              No hay mediciones registradas.
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}
