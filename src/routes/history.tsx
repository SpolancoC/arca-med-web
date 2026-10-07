import { createFileRoute } from "@/lib/router";
import { History } from "lucide-react";
import { Section } from "@/components/arca/clinical";
export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Historial clínico — ARCA Med" },
      {
        name: "description",
        content:
          "Revisa la actividad longitudinal de pacientes y acciones clínicas.",
      },
      { property: "og:title", content: "Historial clínico — ARCA Med" },
      {
        property: "og:description",
        content: "Historial longitudinal de actividad clínica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
const events = [
  "Medición ROM actualizada para Rosa Martínez",
  "Plan de ejercicios validado para Daniel Gil",
  "Revisión de triaje completada para Javier Prieto",
  "Evaluación cerrada para Amelia Soto",
  "Resumen clínico revisado para Lucía Cordero",
];
function Page() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-accent">
          Actividad longitudinal
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Historial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Una cronología clara de acciones clínicas y actualizaciones recientes.
        </p>
      </div>
      <Section title="Actividad clínica">
        <div className="mt-4 space-y-1">
          {events.map((event, index) => (
            <div
              key={event}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md p-3 hover:bg-muted"
            >
              <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary">
                <History className="size-4" />
              </span>
              <p className="text-sm font-medium">{event}</p>
              <time className="text-xs text-muted-foreground">
                {20 - index} sep 2026
              </time>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
