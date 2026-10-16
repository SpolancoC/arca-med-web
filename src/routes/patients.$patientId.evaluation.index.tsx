import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@/lib/router";
import { ArrowLeft, Check, ChevronRight, Info } from "lucide-react";

import {
  EvaluationInstructionImage,
  evaluationInstructions,
} from "@/components/arca/evaluation-instructions";

import { Section } from "@/components/arca/clinical";
import { Button } from "@/components/ui/button";
import { getPatientSummary } from "@/services/patient-detail";

export const Route = createFileRoute("/patients/$patientId/evaluation/")({
  head: () => ({
    meta: [
      {
        title: "Preparación para la evaluación — ARCA Med",
      },
    ],
  }),
  component: EvaluationPreparation,
});

function EvaluationPreparation() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const id = Number(patientId);

  const [confirmed, setConfirmed] = useState(false);
  const [articulations, setArticulations] = useState<string[]>([]);
  const [selectedArticulation, setSelectedArticulation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setConfirmed(false);
    setArticulations([]);
    setSelectedArticulation("");

    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Identificador de paciente inválido.");
      setLoading(false);
      return;
    }

    async function loadEvaluation() {
      try {
        const summary = await getPatientSummary(id);

        const available = [
          ...new Set(
            (summary.metricas_fisicas ?? [])
              .map((metric) => metric.articulacion?.trim())
              .filter((value): value is string => Boolean(value)),
          ),
        ];

        if (!active) return;

        setArticulations(available);

        if (available.length === 1) {
          setSelectedArticulation(available[0]);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la información clínica.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadEvaluation();

    return () => {
      active = false;
    };
  }, [id]);

  const canContinue =
    confirmed && Boolean(selectedArticulation) && !loading && !error;

  function handleContinue() {
    if (!canContinue) return;

    sessionStorage.setItem(
      `arca-evaluation-articulation-${patientId}`,
      selectedArticulation,
    );

    void navigate({
      to: "/patients/$patientId/evaluation/camera",
      params: { patientId },
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/patients/$patientId" params={{ patientId }}>
            <ArrowLeft className="size-4" />
            Volver a la ficha
          </Link>
        </Button>

        <p className="mt-4 text-xs font-semibold uppercase text-accent">
          Nueva evaluación · Paciente #{patientId}
        </p>

        <h1 className="mt-1 font-display text-3xl font-semibold">
          Preparación para la evaluación
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Revisa la articulación y las indicaciones de preparación antes de
          continuar.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Cargando información clínica...
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <Section
            title="Articulación a evaluar"
            description="Articulaciones registradas en las métricas físicas del paciente."
          >
            <div className="mt-4">
              {articulations.length > 0 ? (
                <select
                  value={selectedArticulation}
                  onChange={(event) => {
                    setSelectedArticulation(event.target.value);
                    setConfirmed(false);
                  }}
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm sm:max-w-sm"
                >
                  <option value="">Selecciona una articulación</option>

                  {articulations.map((articulation) => (
                    <option key={articulation} value={articulation}>
                      {articulation.charAt(0).toUpperCase() +
                        articulation.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este paciente no tiene articulaciones registradas en su
                  resumen clínico. No es posible seleccionar una evaluación.
                </p>
              )}
            </div>
          </Section>

          {selectedArticulation && (
            <Section
              title={`Evaluación de ${selectedArticulation}`}
              description="Revisa las indicaciones antes de continuar."
            >
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-center">
                <EvaluationInstructionImage
                  articulation={selectedArticulation}
                />

                <div>
                  <h2 className="text-sm font-semibold">
                    Indicaciones para el paciente
                  </h2>

                  <ol className="mt-4 space-y-3">
                    {evaluationInstructions.map((instruction, index) => (
                      <li
                        key={instruction}
                        className="flex gap-3 text-sm leading-5 text-muted-foreground"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                          {index + 1}
                        </span>

                        <span className="pt-0.5">{instruction}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-5 flex gap-2 rounded-md border border-info-border bg-info-soft p-3 text-xs leading-5 text-info">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>
                      La articulación seleccionada proviene del resumen clínico.
                      El movimiento específico debe ser indicado por el
                      profesional.
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          )}

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/75 p-4 shadow-clinical sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={!selectedArticulation}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="peer sr-only"
              />
              <span className="grid size-5 place-items-center rounded border border-input bg-surface-raised text-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                {confirmed && <Check className="size-3.5" />}
              </span>
              Entiendo las instrucciones
            </label>

            <Button disabled={!canContinue} onClick={handleContinue}>
              Continuar a la cámara
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
