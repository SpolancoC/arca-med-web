import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";

import {
  getRegisteredPatients,
  type RegisteredPatient,
} from "@/services/patients";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Pacientes — ARCA Med" },
      {
        name: "description",
        content: "Directorio de pacientes registrados.",
      },
    ],
  }),
  component: PatientsPage,
});

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
  const [patients, setPatients] = useState<RegisteredPatient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = localStorage.getItem("arca-med-role");
  const isAdmin = role === "admin";

  useEffect(() => {
    let active = true;

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    async function loadPatients() {
      setLoading(true);
      setError(null);

      try {
        const data = await getRegisteredPatients();

        if (active) {
          setPatients(data);
        }
      } catch (err) {
        if (active) {
          const status = (err as { status?: number })?.status;

          setError(
            status === 403
              ? "Tu cuenta no tiene permiso para consultar este directorio."
              : err instanceof Error
                ? err.message
                : "No se pudieron cargar los pacientes.",
          );
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
  }, [isAdmin]);

  const filteredPatients = patients.filter((patient) => {
    const term = search.trim().toLowerCase();

    return (
      patient.nombre.toLowerCase().includes(term) ||
      patient.email.toLowerCase().includes(term) ||
      String(patient.id).includes(term)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-accent">
          Directorio clínico
        </p>

        <h1 className="mt-1 font-display text-3xl font-semibold">Pacientes</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Directorio general de pacientes registrados en ARCA Med.
        </p>
      </div>

      {!isAdmin ? (
        <Section title="Directorio de pacientes">
          <div className="mt-4 rounded-md border border-info-border bg-info-soft p-4 text-sm text-info">
            El directorio general todavía no está disponible para el rol médico.
            <p className="mt-2">
              Se necesita un endpoint de consulta autorizado para médicos. La
              lista de triaje continúa disponible en su sección correspondiente.
            </p>
          </div>
        </Section>
      ) : (
        <Section
          title="Pacientes registrados"
          action={
            <label className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
              <Search className="size-4 text-muted-foreground" />

              <input
                aria-label="Buscar pacientes"
                placeholder="Buscar pacientes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-40 bg-transparent text-sm outline-none"
              />
            </label>
          }
        >
          <div className="mt-4">
            {!loading && !error && (
              <p className="mb-4 text-sm text-muted-foreground">
                Mostrando {filteredPatients.length} de {patients.length}{" "}
                pacientes
              </p>
            )}

            {loading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Cargando pacientes...
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="py-8 text-center text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="pb-3 font-semibold">Paciente</th>
                      <th className="pb-3 font-semibold">Identificador</th>
                      <th className="pb-3 font-semibold">Correo electrónico</th>
                      <th className="pb-3 font-semibold">Estado</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                              {getInitials(patient.nombre)}
                            </span>

                            <span className="font-semibold">
                              {patient.nombre}
                            </span>
                          </div>
                        </td>

                        <td className="py-4">#{patient.id}</td>

                        <td className="py-4 text-muted-foreground">
                          {patient.email}
                        </td>

                        <td className="py-4">
                          <span
                            className={
                              patient.activo
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {patient.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {filteredPatients.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <Users className="mx-auto mb-2 size-6" />
                          No se encontraron pacientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 border-t border-border pt-4">
              <Button asChild variant="secondary">
                <Link to="/triage">Ir a Triaje</Link>
              </Button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
