import { Link, createFileRoute } from "@/lib/router";
import { Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, PageHeader } from "@/components/arca/ui-kit";

export const Route = createFileRoute("/dashboard/active")({
  head: () => ({
    meta: [
      { title: "Pacientes activos — ARCA Med" },
      {
        name: "description",
        content: "Estado de la integración del directorio médico de pacientes.",
      },
    ],
  }),
  component: ActivePatients,
});

function ActivePatients() {
  return (
    <div className="space-y-5">
      <PageHeader
        back={<BackButton to="/">Volver al panel</BackButton>}
        eyebrow="Panel principal"
        title="Pacientes activos"
        description="Listado de pacientes en seguimiento médico."
      />

      <Section
        title="Directorio médico pendiente"
        description="Sin datos de pacientes activos disponibles en el backend actual"
      >
        <div className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              El backend todavía no expone GET /pacientes para el rol médico ni
              un estado de seguimiento activo. Por eso, no es posible calcular
              el total de pacientes activos ni mostrar sus fichas en este
              listado.
            </p>

            <p>
              Los pacientes de Triaje corresponden a prediagnósticos pendientes:
              no equivalen al directorio de pacientes activos.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link to="/patients">
                  <Users className="size-4" />
                  Ir a Pacientes
                </Link>
              </Button>

              <Button asChild size="sm" variant="outline">
                <Link to="/triage">Ver Triaje pendiente</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
