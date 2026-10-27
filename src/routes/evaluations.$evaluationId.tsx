import { Link, createFileRoute } from "@/lib/router";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { PageHeader } from "@/components/arca/ui-kit";

export const Route = createFileRoute("/evaluations/$evaluationId")({
  head: () => ({ meta: [{ title: "Resultados de evaluación — ARCA Med" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="ARCA Med" title="Resultados de evaluación" description="Información clínica sin registros de demostración" />
      <Section title="Resultados pendientes">
        <div role="status" className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>No hay un endpoint de consulta de evaluaciones históricas para mostrar este resultado con datos verificados.</p>
            <Button asChild size="sm" variant="secondary"><Link to="/evaluations">Volver a evaluaciones</Link></Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
