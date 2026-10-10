import { Link, createFileRoute } from "@/lib/router";
import { CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";

export const Route = createFileRoute("/dashboard/today")({
  head: () => ({ meta: [{ title: "Estado de agenda — ARCA Med" }] }),
  component: AgendaStatus,
});

function AgendaStatus() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-accent">
          Agenda médica
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Agenda de pacientes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La visualización de citas se habilitará cuando exista el servicio de
          agenda en el backend.
        </p>
      </div>
      <Section
        title="Integración pendiente"
        description="Sin datos de citas disponibles"
      >
        <div className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              El backend todavía no dispone de un endpoint para obtener citas de
              un médico por fecha. No podemos afirmar que un día esté libre ni
              mostrar consultas agendadas.
            </p>
            <p>
              Requerimiento para André: endpoint de agenda con ID de cita,
              paciente, fecha, hora, tipo, estado y médico asignado.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/">
            <CalendarDays className="size-4" /> Volver al panel
          </Link>
        </Button>
      </Section>
    </div>
  );
}
