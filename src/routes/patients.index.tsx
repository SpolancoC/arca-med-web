import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, TriageBadge } from "@/components/arca/clinical";
import { getTriagePatients } from "@/services/triage";

type TriagePatient = Awaited<ReturnType<typeof getTriagePatients>>[number];
type Priority = "High" | "Medium" | "Low";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Pacientes — ARCA Med" },
      {
        name: "description",
        content: "Pacientes pendientes de revisión clínica.",
      },
    ],
  }),
  component: PatientsPage,
});

function mapPriority(value: string): Priority | null {
  switch (value.trim().toLowerCase()) {
    case "alta":
    case "high":
      return "High";
    case "media":
    case "medium":
      return "Medium";
    case "baja":
    case "low":
      return "Low";
    default:
      return null;
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function PatientsPage() {
  const [patients, setPatients] = useState<TriagePatient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      try {
        const data = await getTriagePatients();

        if (active) {
          setPatients(data);
        }
      } catch (err) {
        console.error("Error al cargar pacientes:", err);

        if (active) {
          setError("No se pudieron cargar los pacientes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPatients();

    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = patients.filter((patient) =>
    patient.nombre.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-accent">
          Directorio clínico
        </p>

        <h1 className="mt-1 font-display text-3xl font-semibold">Pacientes</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Pacientes con prediagnósticos pendientes de revisión médica.
        </p>
      </div>

      <Section
        title="Pacientes pendientes de revisión"
        action={
          <label className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
            <Search className="size-4 text-muted-foreground" />

            <input
              aria-label="Buscar pacientes"
              placeholder="Buscar pacientes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Cargando pacientes...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredPatients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {search.trim()
                      ? "No se encontraron pacientes con ese nombre."
                      : "No hay pacientes pendientes de revisión clínica."}
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredPatients.map((patient) => {
                  const priority = mapPriority(patient.urgencia_sugerida);

                  return (
                    <tr key={patient.usuario_id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                            {getInitials(patient.nombre)}
                          </span>

                          <div>
                            <p className="font-semibold">{patient.nombre}</p>

                            <p className="text-xs text-muted-foreground">
                              ID: {patient.usuario_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="text-muted-foreground">Sin información</td>

                      <td>
                        {priority ? (
                          <TriageBadge priority={priority} />
                        ) : (
                          <span className="text-muted-foreground">
                            Sin clasificar
                          </span>
                        )}
                      </td>

                      <td className="text-muted-foreground">Sin información</td>

                      <td className="text-muted-foreground">
                        Pendiente de revisión
                      </td>

                      <td className="text-right">
                        <Button asChild variant="secondary" size="sm">
                          <Link
                            to="/patients/$patientId"
                            params={{
                              patientId: String(patient.usuario_id),
                            }}
                          >
                            Ver ficha
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
