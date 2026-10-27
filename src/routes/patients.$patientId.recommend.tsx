import { Link, createFileRoute } from "@/lib/router";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { PageHeader } from "@/components/arca/ui-kit";

export const Route = createFileRoute("/patients/$patientId/recommend")({
  head: () => ({ meta: [{ title: "Recomendar ejercicio — ARCA Med" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="ARCA Med" title="Recomendar ejercicio" description="Información clínica sin registros de demostración" />
      <Section title="Asignación pendiente">
        <div role="status" className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>El backend todavía no permite asignar ejercicios a un paciente. Esta pantalla no guardará prescripciones localmente ni mostrará confirmaciones falsas.</p>
            <Button asChild size="sm" variant="secondary"><Link to="/patients">Volver a Pacientes</Link></Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
