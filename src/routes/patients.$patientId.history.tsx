import { Link, createFileRoute } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Metric, RomChart, Section } from "@/components/arca/clinical";
import { BackButton, DataTable, PageHeader, StatusPill } from "@/components/arca/ui-kit";
import { patientHistory, profileFor } from "@/lib/arca-data";
import { useMockPatients } from "@/lib/mock-store";

export const Route = createFileRoute("/patients/$patientId/history")({
  head: () => ({ meta: [
    { title: "Historial del paciente — ARCA Med" },
    { name: "description", content: "Historial clínico y evolución de evaluaciones del paciente." },
    { property: "og:title", content: "Historial del paciente — ARCA Med" },
    { property: "og:description", content: "Evaluaciones anteriores y evolución del rango de movimiento." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PatientHistory,
});

function PatientHistory() {
  const { patientId } = Route.useParams();
  const patient = useMockPatients().find((p) => p.id === patientId);
  if (!patient) return <BackButton to="/patients">Volver a pacientes</BackButton>;
  const profile = profileFor(patientId);
  const history = patientHistory(patientId);
  const first = history[0]; const last = history.at(-1);
  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/patients/$patientId" params={{ patientId }}>Volver a la ficha</BackButton>} eyebrow={`Historial clínico · ${patient.id}`} title={patient.name} description={`${patient.condition} · ${patient.region}`} />
    {history.length === 0 ? <Section title="Sin evaluaciones"><p className="mt-3 text-sm text-muted-foreground">Este paciente aún no tiene evaluaciones registradas.</p><Button asChild className="mt-4"><Link to="/patients/$patientId/evaluation" params={{ patientId }}>Iniciar primera evaluación</Link></Button></Section> : <>
      <Section title="Evolución del rango de movimiento" description={profile.movement}>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4"><Metric label="Evaluaciones" value={String(history.length)} /><Metric label="Inicial" value={`${first!.value}°`} /><Metric label="Actual" value={`${last!.value}°`} /><Metric label="Evolución" value={`${last!.value - first!.value >= 0 ? "+" : ""}${last!.value - first!.value}°`} /></div>
        <RomChart data={history.map((e) => ({ date: e.date.replace(" 2026", ""), value: e.value }))} height={260} />
      </Section>
      <Section title="Evaluaciones anteriores" description="Selecciona una evaluación para ver sus resultados detallados">
        <DataTable minWidth={820} head={["Fecha", "Articulación", "Movimiento", "Resultado", "Evolución", "Estado", ""]}>
          {[...history].reverse().map((e) => { const i = history.indexOf(e); const d = i === 0 ? null : e.value - history[i - 1]!.value; return <tr key={e.id}>
            <td className="font-semibold">{e.date}</td><td>{e.joint}</td><td>{e.movement}</td><td>{e.value}°</td>
            <td className={d === null ? "text-muted-foreground" : d > 0 ? "font-semibold text-accent" : d < 0 ? "font-semibold text-priority-high-foreground" : "text-muted-foreground"}>{d === null ? "Inicial" : d === 0 ? "Sin cambio" : `${d > 0 ? "+" : ""}${d}°`}</td>
            <td><StatusPill>{e.status}</StatusPill></td>
            <td className="text-right"><Button asChild variant="secondary" size="sm"><Link to="/evaluations/$evaluationId" params={{ evaluationId: e.id }}>Ver resultados</Link></Button></td>
          </tr>; })}
        </DataTable>
      </Section>
    </>}
  </div>;
}
