import { Link, createFileRoute } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, DataTable, PageHeader, StatusPill } from "@/components/arca/ui-kit";
import { patients, todayEvaluations } from "@/lib/arca-data";

export const Route = createFileRoute("/dashboard/today")({
  head: () => ({ meta: [
    { title: "Evaluaciones de hoy — ARCA Med" },
    { name: "description", content: "Evaluaciones clínicas realizadas durante el día." },
    { property: "og:title", content: "Evaluaciones de hoy — ARCA Med" },
    { property: "og:description", content: "Registro diario de evaluaciones de movimiento." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TodayEvaluations,
});

function TodayEvaluations() {
  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/">Volver al panel</BackButton>} eyebrow="Lunes, 21 de septiembre" title="Evaluaciones de hoy" description="Evaluaciones realizadas durante el día. Selecciona una para revisar sus resultados." />
    <Section title={`${todayEvaluations.length} evaluaciones registradas`}>
      <DataTable minWidth={900} head={["Paciente", "Tipo de evaluación", "Articulación", "Fecha / hora", "Resultado", "Estado", "Profesional", ""]}>
        {todayEvaluations.map((e) => <tr key={e.id}>
          <td className="font-semibold">{patients.find((p) => p.id === e.patientId)?.name}</td><td>{e.type}</td><td>{e.joint}</td>
          <td>{e.date} · {e.time}</td><td>{e.value}° {e.movement.toLowerCase()}</td><td><StatusPill>{e.status}</StatusPill></td>
          <td className="text-muted-foreground">{e.professional}</td>
          <td className="text-right"><Button asChild variant="secondary" size="sm"><Link to="/evaluations/$evaluationId" params={{ evaluationId: e.id }}>Ver resultados</Link></Button></td>
        </tr>)}
      </DataTable>
    </Section>
  </div>;
}
