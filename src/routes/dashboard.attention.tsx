import { Link, createFileRoute } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Section, TriageBadge } from "@/components/arca/clinical";
import { BackButton, Initials, PageHeader, StatusPill } from "@/components/arca/ui-kit";
import { patients, profileFor } from "@/lib/arca-data";

export const Route = createFileRoute("/dashboard/attention")({
  head: () => ({ meta: [
    { title: "Pacientes que requieren atención — ARCA Med" },
    { name: "description", content: "Pacientes con acciones clínicas pendientes, priorizados por triaje." },
    { property: "og:title", content: "Pacientes que requieren atención — ARCA Med" },
    { property: "og:description", content: "Acciones clínicas pendientes por paciente." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Attention,
});

const order = { High: 0, Medium: 1, Low: 2 };

function Attention() {
  const list = [...patients].sort((a, b) => order[a.priority] - order[b.priority]);
  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/">Volver al panel</BackButton>} eyebrow="Panel principal" title="Pacientes que requieren atención" description="Pacientes con alguna acción pendiente, ordenados por prioridad de triaje." />
    <Section title="Acciones pendientes" description="La prioridad es una ayuda para organizar el trabajo; la decisión final es del profesional.">
      <div className="mt-3 divide-y divide-border">{list.map((p) => { const profile = profileFor(p.id); return <div key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
        <Initials>{p.initials}</Initials>
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name}, {p.age}</p><p className="truncate text-xs text-muted-foreground">{p.id} · {p.condition} · {p.region}</p></div>
        <div className="col-span-3 col-start-2 md:col-span-1 md:col-start-auto"><StatusPill>{profile.attentionReason}</StatusPill><p className="mt-1 text-[11px] text-muted-foreground">Próxima revisión: {profile.nextReview}</p></div>
        <TriageBadge priority={p.priority} />
        <Button asChild variant="secondary" size="sm" className="row-start-1 col-start-3 md:row-auto md:col-auto"><Link to="/patients/$patientId" params={{ patientId: p.id }}>Abrir ficha</Link></Button>
      </div>; })}</div>
    </Section>
  </div>;
}
