import { Link, createFileRoute } from "@/lib/router";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, TriageBadge } from "@/components/arca/clinical";
import { patients } from "@/lib/arca-data";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Pacientes — ARCA Med" },
      {
        name: "description",
        content:
          "Revisa pacientes musculoesqueléticos activos y su estado clínico.",
      },
      { property: "og:title", content: "Pacientes — ARCA Med" },
      {
        property: "og:description",
        content: "Lista clínica de pacientes y resumen de estados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientsPage,
});
function PatientsPage() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">
            Directorio clínico
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Pacientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisa el estado, prioridad de triaje y últimas mediciones de
            movilidad.
          </p>
        </div>
        <Button asChild>
          <Link to="/patients/new">
            <UserPlus className="size-4" />
            Añadir paciente
          </Link>
        </Button>
      </div>
      <Section
        title="Lista de pacientes activos"
        action={
          <label className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              aria-label="Buscar pacientes"
              placeholder="Buscar pacientes"
              className="w-36 bg-transparent text-sm outline-none"
            />
          </label>
        }
      >
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="pb-3 font-semibold">Paciente</th>
                <th className="pb-3 font-semibold">Última evaluación</th>
                <th className="pb-3 font-semibold">Prioridad</th>
                <th className="pb-3 font-semibold">Patología</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {patient.initials}
                      </span>
                      <div>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient.age} años · {patient.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{patient.lastEvaluation}</td>
                  <td>
                    <TriageBadge priority={patient.priority} />
                  </td>
                  <td>{patient.condition}</td>
                  <td className="text-muted-foreground">{patient.status}</td>
                  <td className="text-right">
                    <Button asChild variant="secondary" size="sm">
                      <Link
                        to="/patients/$patientId"
                        params={{ patientId: patient.id }}
                      >
                        Ver ficha
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
