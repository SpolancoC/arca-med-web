import { Link, createFileRoute, useNavigate } from "@/lib/router";
import { ArrowLeft, Check, ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import {
  EvaluationInstructionImage,
  evaluationInstructions,
} from "@/components/arca/evaluation-instructions";
import { Section } from "@/components/arca/clinical";
import { Button } from "@/components/ui/button";
import { patients } from "@/lib/arca-data";

export const Route = createFileRoute("/patients/$patientId/evaluation/")({
  head: () => ({
    meta: [
      { title: "Preparación para la evaluación — ARCA Med" },
      {
        name: "description",
        content:
          "Instrucciones de preparación para una evaluación de movimiento articular.",
      },
      {
        property: "og:title",
        content: "Preparación para la evaluación — ARCA Med",
      },
      {
        property: "og:description",
        content:
          "Preparación guiada para la evaluación del rango de movimiento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvaluationPreparation,
});

function EvaluationPreparation() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const patient = patients.find((item) => item.id === patientId) ?? patients[0];
  if (!patient) return null;
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
          Nueva evaluación · {patient.name}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Preparación para la evaluación
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Antes de comenzar, sigue estas indicaciones para obtener una medición
          correcta y segura del movimiento de la {patient.region.toLowerCase()}.
        </p>
      </div>
      <Section
        title="Flexión de rodilla"
        description="Revisa la posición y el movimiento antes de continuar"
      >
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-center">
          <EvaluationInstructionImage />
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
                Detén el movimiento si aparece dolor intenso o inestabilidad.
              </p>
            </div>
          </div>
        </div>
      </Section>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/75 p-4 shadow-clinical sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="peer sr-only"
          />
          <span className="grid size-5 place-items-center rounded border border-input bg-surface-raised text-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
            {confirmed && <Check className="size-3.5" />}
          </span>
          Entiendo las instrucciones
        </label>
        <Button
          disabled={!confirmed}
          onClick={() =>
            void navigate({
              to: "/patients/$patientId/evaluation/camera",
              params: { patientId },
            })
          }
        >
          Continuar a la cámara
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
