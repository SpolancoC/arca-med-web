import { Link, createFileRoute } from "@/lib/router";
import {
  ArrowLeft,
  Camera,
  Circle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { patients } from "@/lib/arca-data";

export const Route = createFileRoute("/patients/$patientId/evaluation/camera")({
  head: () => ({
    meta: [
      { title: "Cámara de evaluación — ARCA Med" },
      {
        name: "description",
        content:
          "Simulación de evaluación clínica de movimiento mediante cámara.",
      },
      { property: "og:title", content: "Cámara de evaluación — ARCA Med" },
      {
        property: "og:description",
        content: "Evaluación guiada del rango de movimiento articular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EvaluationCamera,
});

function EvaluationCamera() {
  const { patientId } = Route.useParams();
  const [inProgress, setInProgress] = useState(false);
  const patient = patients.find((item) => item.id === patientId) ?? patients[0];
  if (!patient) return null;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">
            Evaluación de movimiento · {patient.name}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Cámara de evaluación
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Flexión de rodilla izquierda
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
          <span className="size-2 rounded-full bg-accent" />
          Cámara activa
        </span>
      </div>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
        <div className="relative grid aspect-video min-h-[360px] place-items-center overflow-hidden bg-muted">
          <div className="absolute inset-5 rounded-md border border-primary/30">
            <span className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-primary" />
            <span className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-primary" />
            <span className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-primary" />
            <span className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-primary" />
          </div>
          <div className="relative text-center">
            <span className="mx-auto grid size-20 place-items-center rounded-full border border-border bg-surface-raised text-primary">
              <Camera className="size-8" />
            </span>
            <p className="mt-4 text-sm font-semibold">
              Vista previa de la cámara
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              El paciente debe permanecer visible de cuerpo completo
            </p>
          </div>
          {inProgress && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-surface-glass px-5 py-3 backdrop-blur-xl">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Circle className="size-3 fill-destructive text-destructive" />
                Evaluación en progreso
              </span>
              <span className="text-xs text-muted-foreground">
                Capturando movimiento…
              </span>
            </div>
          )}
        </div>
        <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <RotateCcw className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                Movimiento indicado: flexión de rodilla
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Flexiona lentamente la rodilla izquierda hacia atrás y regresa a
                la posición inicial. Mantén el tronco estable.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/patients/$patientId/evaluation" params={{ patientId }}>
                <ArrowLeft className="size-4" />
                {inProgress ? "Cancelar" : "Volver"}
              </Link>
            </Button>
            <Button onClick={() => setInProgress(true)} disabled={inProgress}>
              <ShieldCheck className="size-4" />
              {inProgress ? "Evaluación en progreso" : "Comenzar evaluación"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
