import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { CalendarDays, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, TriageBadge } from "@/components/arca/clinical";
import {
  getPatientSummary,
  getPatientSymptoms,
  getPatientDocuments,
  reviewPatientSummary,
  type PatientSummary,
  type PatientSymptom,
  type PatientDocument,
} from "@/services/patient-detail";

import { Dumbbell } from "lucide-react";

import { getExercises, type Exercise } from "@/services/exercises";

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

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState<string | null>(null);
  const [exerciseRegion, setExerciseRegion] = useState("");

  const [reviewing, setReviewing] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const isDoctor = localStorage.getItem("arca-med-role") === "medico";

  async function handleReviewSummary() {
    if (!isDoctor || !summary || reviewing) return;

    setReviewing(true);
    setReviewError(null);

    try {
      await reviewPatientSummary(id);
      setReviewSuccess(true);
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : "No fue posible revisar el resumen.",
      );
    } finally {
      setReviewing(false);
    }
  }

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

  useEffect(() => {
    let active = true;

    async function loadExercises() {
      setExercisesLoading(true);
      setExercisesError(null);

      try {
        const data = await getExercises();

        if (active) {
          setExercises(data);
        }
      } catch (err) {
        if (active) {
          setExercisesError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los ejercicios.",
          );
        }
      } finally {
        if (active) {
          setExercisesLoading(false);
        }
      }
    }

    void loadExercises();

    return () => {
      active = false;
    };
  }, []);

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

  const exerciseRegions = [
    ...new Set(exercises.map((exercise) => exercise.articulacion)),
  ].sort((a, b) => a.localeCompare(b, "es"));

  const visibleExercises = exercises.filter(
    (exercise) => !exerciseRegion || exercise.articulacion === exerciseRegion,
  );

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
        <div className="mt-3 space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {summary?.resumen_generado || "No hay resumen clínico disponible."}
          </p>

          {isDoctor && summary && (
            <div className="border-t border-border pt-4">
              {reviewSuccess ? (
                <p role="status" className="text-sm font-medium text-green-600">
                  Resumen marcado como revisado correctamente.
                </p>
              ) : (
                <Button
                  onClick={() => void handleReviewSummary()}
                  disabled={reviewing}
                >
                  {reviewing
                    ? "Guardando revisión..."
                    : "Marcar resumen como revisado"}
                </Button>
              )}

              {reviewError && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {reviewError}
                </p>
              )}
            </div>
          )}
        </div>
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
        <Section
          title="Ejercicios de rehabilitación"
          description="Consulta los ejercicios disponibles en la biblioteca clínica."
        >
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <select
                value={exerciseRegion}
                onChange={(event) => setExerciseRegion(event.target.value)}
                className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm"
              >
                <option value="">Todas las articulaciones</option>

                {exerciseRegions.map((region) => (
                  <option key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </option>
                ))}
              </select>

              <Button asChild variant="secondary" size="sm">
                <Link to="/exercises">Ver biblioteca completa</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Estos ejercicios son referencias de la biblioteca. No están
              asignados a este paciente.
            </p>

            {exercisesLoading && (
              <p className="text-sm text-muted-foreground">
                Cargando ejercicios...
              </p>
            )}

            {exercisesError && (
              <p role="alert" className="text-sm text-destructive">
                {exercisesError}
              </p>
            )}

            {!exercisesLoading && !exercisesError && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex flex-col rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="size-4 text-primary" />

                      <span className="text-xs font-semibold uppercase text-accent">
                        {exercise.articulacion}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold">
                      {exercise.nombre_ejercicio}
                    </h3>

                    <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-line text-xs leading-5 text-muted-foreground">
                      {exercise.descripcion || "Sin descripción disponible."}
                    </p>

                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                    >
                      <Link
                        to="/exercises/$exerciseId"
                        params={{
                          exerciseId: String(exercise.id),
                        }}
                      >
                        Revisar ejercicio
                      </Link>
                    </Button>
                  </div>
                ))}

                {visibleExercises.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay ejercicios disponibles para esta articulación.
                  </p>
                )}
              </div>
            )}
          </div>
        </Section>

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
