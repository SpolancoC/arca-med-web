import { Link, createFileRoute } from "@/lib/router";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, PageHeader } from "@/components/arca/ui-kit";

export const Route = createFileRoute("/dashboard/exercise-reviews")({
  head: () => ({
    meta: [
      { title: "Revisiones de ejercicios pendientes — ARCA Med" },
      {
        name: "description",
        content: "Estado de integración de las revisiones de ejercicios.",
      },
    ],
  }),
  component: ExerciseReviews,
});

function ExerciseReviews() {
  return (
    <div className="space-y-5">
      <PageHeader
        back={<BackButton to="/">Volver al panel</BackButton>}
        eyebrow="Panel principal"
        title="Revisiones de ejercicios pendientes"
        description="Seguimiento profesional de ejercicios de pacientes."
      />

      <Section
        title="Integración pendiente"
        description="Sin datos de revisiones disponibles en la API"
      >
        <div className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              El backend permite a los pacientes registrar una ejecución de
              ejercicio, pero todavía no ofrece al médico un listado de
              ejecuciones, asignaciones o revisiones pendientes.
            </p>

            <p>
              No se muestran ejercicios ni pacientes de ejemplo para evitar
              confundir datos simulados con información clínica real.
            </p>

            <Button asChild variant="secondary" size="sm">
              <Link to="/">Volver al Dashboard</Link>
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
