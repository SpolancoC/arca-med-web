import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Section, TriageBadge } from "@/components/arca/clinical";
import { BackButton, Initials, PageHeader } from "@/components/arca/ui-kit";
import { getTriagePatients, type TriagePatient } from "@/services/triage";

export const Route = createFileRoute("/dashboard/attention")({
  head: () => ({
    meta: [
      {
        title: "Pacientes que requieren atención — ARCA Med",
      },
    ],
  }),
  component: Attention,
});

type Priority = "High" | "Medium" | "Low";

function getPriority(value: string): Priority | null {
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

const priorityOrder: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function Attention() {
  const [patients, setPatients] = useState<TriagePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getTriagePatients()
      .then((data) => {
        if (active) setPatients(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los pacientes.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const list = useMemo(() => {
    const unique = new Map<number, TriagePatient>();

    for (const patient of patients) {
      const previous = unique.get(patient.usuario_id);
      const currentPriority = getPriority(patient.urgencia_sugerida);
      const previousPriority = previous
        ? getPriority(previous.urgencia_sugerida)
        : null;

      if (
        !previous ||
        (currentPriority ? priorityOrder[currentPriority] : 3) <
          (previousPriority ? priorityOrder[previousPriority] : 3)
      ) {
        unique.set(patient.usuario_id, patient);
      }
    }

    return [...unique.values()].sort((a, b) => {
      const pa = getPriority(a.urgencia_sugerida);
      const pb = getPriority(b.urgencia_sugerida);

      return (pa ? priorityOrder[pa] : 3) - (pb ? priorityOrder[pb] : 3);
    });
  }, [patients]);

  return (
    <div className="space-y-5">
      <PageHeader
        back={<BackButton to="/">Volver al panel</BackButton>}
        eyebrow="Panel principal"
        title="Pacientes que requieren atención"
        description="Pacientes con prediagnósticos pendientes de revisión médica."
      />

      <Section
        title="Acciones pendientes"
        description="Pacientes ordenados por urgencia sugerida."
      >
        {loading && (
          <p className="mt-4 text-sm text-muted-foreground">
            Cargando pacientes...
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && list.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No existen prediagnósticos pendientes de revisión.
          </p>
        )}

        {!loading && !error && (
          <div className="mt-3 divide-y divide-border">
            {list.map((patient) => {
              const priority = getPriority(patient.urgencia_sugerida);

              return (
                <div
                  key={patient.usuario_id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <Initials>{patient.nombre}</Initials>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {patient.nombre}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Paciente #{patient.usuario_id}
                    </p>
                  </div>

                  {priority ? (
                    <TriageBadge priority={priority} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {patient.urgencia_sugerida || "Sin clasificar"}
                    </span>
                  )}

                  <Button asChild variant="secondary" size="sm">
                    <Link
                      to="/patients/$patientId"
                      params={{
                        patientId: String(patient.usuario_id),
                      }}
                    >
                      Abrir ficha
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
