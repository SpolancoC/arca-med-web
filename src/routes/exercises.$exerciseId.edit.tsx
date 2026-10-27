import { Link, createFileRoute } from "@/lib/router";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { PageHeader } from "@/components/arca/ui-kit";

export const Route = createFileRoute("/exercises/$exerciseId/edit")({
  head: () => ({ meta: [{ title: "Editar ejercicio — ARCA Med" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="ARCA Med" title="Editar ejercicio" description="Información clínica sin registros de demostración" />
      <Section title="Edición pendiente de API">
        <div role="status" className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>La edición de ejercicios no dispone todavía de un endpoint de actualización. Se deshabilitó el guardado local que simulaba persistencia.</p>
            <Button asChild size="sm" variant="secondary"><Link to="/exercises">Volver a Ejercicios</Link></Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
