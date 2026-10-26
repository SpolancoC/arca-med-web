import { createFileRoute } from "@/lib/router";
import { ArrowRight, Info } from "lucide-react";
import { Link } from "@/lib/router";
import { useEffect, useState } from "react";
import { Section, TriageBadge } from "@/components/arca/clinical";
import { getTriagePatients, type TriagePatient } from "@/services/triage";
import type { Priority } from "@/lib/arca-data";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "Triaje — ARCA Med" },
      {
        name: "description",
        content:
          "Revisa resultados de triaje como apoyo a la decisión clínica.",
      },
      { property: "og:title", content: "Triaje — ARCA Med" },
      {
        property: "og:description",
        content: "Revisión clínica de triaje musculoesquelético.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function mapTriagePriority(priority: string): Priority {
  switch (priority.trim().toLowerCase()) {
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
      return "Low";
  }
}

function getPriorityLabel(priority: Priority) {
  const labels: Record<Priority, string> = {
    High: "Alta",
    Medium: "Media",
    Low: "Baja",
  };

  return labels[priority];
}

function Page() {
  const [patients, setPatients] = useState<TriagePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTriage() {
      try {
        setError(null);

        const data = await getTriagePatients();

        setPatients(data);
      } catch (error) {
        console.error("No se pudo cargar el triaje:", error);
        setError("No se pudo cargar la información de triaje.");
      } finally {
        setLoading(false);
      }
    }

    void loadTriage();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-accent">
          Apoyo a la decisión
        </p>

        <h1 className="mt-1 font-display text-3xl font-semibold">Triaje</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Revisa los hallazgos priorizados antes de completar tu decisión
          clínica.
        </p>
      </div>

      <div className="flex gap-2 rounded-md border border-info-border bg-info-soft p-3 text-sm text-info">
        <Info className="mt-0.5 size-4 shrink-0" />

        <p>
          El triaje es una herramienta de apoyo a la decisión clínica. La
          decisión final pertenece al profesional de la salud.
        </p>
      </div>

      {loading && (
        <div className="rounded-md border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">Cargando pacientes...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && patients.length === 0 && (
        <div className="rounded-md border border-border p-6 text-center">
          <p className="text-sm font-semibold">
            No hay pacientes pendientes de triaje
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Los pacientes con información de triaje aparecerán aquí.
          </p>
        </div>
      )}

      {!loading && !error && patients.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {patients.map((patient) => {
            const priority = mapTriagePriority(patient.urgencia_sugerida);

            return (
              <Section
                key={patient.usuario_id}
                title={patient.nombre}
                description={`Paciente #${patient.usuario_id}`}
                action={<TriageBadge priority={priority} />}
              >
                <div className="mt-4 text-sm">
                  <p className="text-xs font-semibold text-primary">
                    Prioridad sugerida
                  </p>

                  <p className="mt-1 text-muted-foreground">
                    {getPriorityLabel(priority)}
                  </p>
                  <Link
                    to="/patients/$patientId"
                    params={{ patientId: String(patient.usuario_id) }}
                    className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Abrir ficha clínica
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Section>
            );
          })}
        </div>
      )}
    </div>
  );
}
