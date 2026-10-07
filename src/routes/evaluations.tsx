import { Link, createFileRoute } from "@/lib/router";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, TriageBadge } from "@/components/arca/clinical";
import { evaluations } from "@/lib/arca-data";
export const Route = createFileRoute("/evaluations")({
  head: () => ({
    meta: [
      { title: "Evaluaciones — ARCA Med" },
      {
        name: "description",
        content:
          "Revisa las evaluaciones clínicas musculoesqueléticas actuales.",
      },
      { property: "og:title", content: "Evaluaciones — ARCA Med" },
      {
        property: "og:description",
        content: "Flujo de evaluaciones clínicas y estados de revisión.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">
            Flujo clínico
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Evaluaciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Completa y revisa las evaluaciones musculoesqueléticas recientes.
          </p>
        </div>
        <Button asChild>
          <Link to="/evaluations/new">
            <ClipboardCheck className="size-4" />
            Nueva evaluación
          </Link>
        </Button>
      </div>
      <Section title="Evaluaciones recientes">
        <div className="mt-4 divide-y divide-border">
          {evaluations.map((item) => (
            <div
              key={item.patient}
              className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
            >
              <div>
                <p className="font-semibold">{item.patient}</p>
                <p className="text-xs text-muted-foreground">
                  {item.date} · {item.region} · {item.rom}
                </p>
              </div>
              <TriageBadge priority={item.priority} />
              <Button size="sm" variant="secondary">
                {item.status}
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
