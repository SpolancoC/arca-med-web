import { Link, createFileRoute } from "@/lib/router";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ClipboardCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metric, RomChart, Section } from "@/components/arca/clinical";
import { BackButton, DataTable, PageHeader, StatusPill } from "@/components/arca/ui-kit";
import { allEvaluations, patientHistory, patients, profileFor } from "@/lib/arca-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evaluations/$evaluationId")({
  head: () => ({ meta: [
    { title: "Resultados de la evaluación — ARCA Med" },
    { name: "description", content: "Resultado de la evaluación de movimiento y comparación con evaluaciones anteriores." },
    { property: "og:title", content: "Resultados de la evaluación — ARCA Med" },
    { property: "og:description", content: "Comparación histórica del rango de movimiento." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Results,
});

function Trend({ delta }: { delta: number }) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : ArrowRight;
  return <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", delta > 0 ? "text-accent" : delta < 0 ? "text-priority-high-foreground" : "text-muted-foreground")}><Icon className="size-3.5" />{delta > 0 ? `+${delta}°` : delta < 0 ? `${delta}°` : "Sin cambio"}</span>;
}

function Results() {
  const { evaluationId } = Route.useParams();
  const evaluation = allEvaluations.find((e) => e.id === evaluationId);
  const patient = patients.find((p) => p.id === evaluation?.patientId);
  if (!evaluation || !patient) return <div className="space-y-4"><BackButton to="/evaluations">Volver a evaluaciones</BackButton><p className="text-sm text-muted-foreground">No encontramos esta evaluación.</p></div>;
  const profile = profileFor(patient.id);
  const history = patientHistory(patient.id);
  const upTo = history.slice(0, history.findIndex((e) => e.id === evaluation.id) + 1);
  const previous = upTo.at(-2);
  const first = upTo[0]!;
  const delta = previous ? evaluation.value - previous.value : 0;
  const total = evaluation.value - first.value;
  const progress = Math.min(100, Math.round((evaluation.value / profile.target) * 100));
  const chart = upTo.map((e, i) => ({ date: e.id === evaluation.id ? "Actual" : `Ev. ${i + 1}`, value: e.value }));
  const verdict = total > 0 ? "El rango de movimiento ha aumentado" : total < 0 ? "El rango de movimiento ha disminuido" : "El rango de movimiento se ha mantenido";

  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/patients/$patientId" params={{ patientId: patient.id }}>Volver al paciente</BackButton>} eyebrow={`Resultados · ${evaluation.id}`} title="Resultados de la evaluación" description={`${evaluation.movement} · ${evaluation.date} · ${evaluation.time}`}
      action={<div className="hidden gap-2 sm:flex"><Button asChild variant="secondary"><Link to="/patients/$patientId" params={{ patientId: patient.id }}>Volver al paciente</Link></Button><Button asChild><Link to="/patients/$patientId/evaluation" params={{ patientId: patient.id }}><ClipboardCheck className="size-4" />Nueva evaluación</Link></Button></div>} />

    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Información del paciente">
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{[["Nombre", patient.name], ["ID", patient.id], ["Edad", `${patient.age} años`], ["Diagnóstico", patient.condition], ["Articulación evaluada", evaluation.joint]].map(([k, v]) => <div key={k}><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
      </Section>
      <Section title="Información de la evaluación">
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{[["Fecha", `${evaluation.date} · ${evaluation.time}`], ["Tipo de evaluación", evaluation.type], ["Movimiento evaluado", evaluation.movement], ["Resultado actual", `${evaluation.value}°`], ["Profesional", evaluation.professional]].map(([k, v]) => <div key={k}><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}<div><dt className="text-[11px] text-muted-foreground">Estado</dt><dd className="mt-0.5"><StatusPill>{evaluation.status}</StatusPill></dd></div></dl>
      </Section>
    </div>

    <Section title="Resultado principal" description={verdict}>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric label="Ángulo obtenido" value={`${evaluation.value}°`} />
        <div className="rounded-md border border-border bg-surface-raised/60 p-3"><p className="text-[11px] font-medium text-muted-foreground">Respecto a la evaluación anterior</p><p className="mt-1 text-xl font-semibold">{previous ? `${previous.value}°` : "—"}</p><Trend delta={delta} /></div>
        <div className="rounded-md border border-border bg-surface-raised/60 p-3"><p className="text-[11px] font-medium text-muted-foreground">Evolución total</p><p className="mt-1 text-xl font-semibold">{total > 0 ? "+" : ""}{total}°</p><p className="text-xs text-muted-foreground">desde {first.date}</p></div>
        <div className="rounded-md border border-border bg-surface-raised/60 p-3"><p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Target className="size-3" />Objetivo clínico {profile.target}°</p><p className="mt-1 text-xl font-semibold">{progress}%</p><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} /></div></div>
      </div>
    </Section>

    <Section title="Comparación con evaluaciones anteriores" description="Evaluación actual frente a las evaluaciones previas del mismo movimiento">
      <div className="mt-2 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <RomChart data={chart} height={260} />
        <ol className="mt-4 space-y-2">{upTo.map((e, i) => { const d = i === 0 ? 0 : e.value - upTo[i - 1]!.value; const current = e.id === evaluation.id; return <li key={e.id} className={cn("flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm", current ? "border-accent/40 bg-accent-soft" : "bg-surface-raised/60")}><span className={cn(current && "font-semibold")}>{current ? "Evaluación actual" : `Evaluación ${i + 1}`}</span><span className="flex items-center gap-3"><strong>{e.value}°</strong>{i > 0 && <Trend delta={d} />}</span></li>; })}</ol>
      </div>
    </Section>

    <Section title="Historial de evaluaciones">
      <DataTable head={["Evaluación", "Fecha", "Tipo", "Resultado", "Cambio", "Estado", ""]}>
        {[...history].reverse().map((e) => { const idx = history.indexOf(e); const d = idx === 0 ? 0 : e.value - history[idx - 1]!.value; return <tr key={e.id} className={cn(e.id === evaluation.id && "bg-primary-soft/40")}>
          <td className="font-semibold">{e.id}</td><td>{e.date}</td><td>{e.type}</td><td>{e.value}°</td><td>{idx === 0 ? <span className="text-xs text-muted-foreground">Inicial</span> : <Trend delta={d} />}</td><td><StatusPill>{e.status}</StatusPill></td>
          <td className="text-right">{e.id !== evaluation.id && <Button asChild variant="ghost" size="sm"><Link to="/evaluations/$evaluationId" params={{ evaluationId: e.id }}>Abrir</Link></Button>}</td>
        </tr>; })}
      </DataTable>
    </Section>

    <div className="flex flex-wrap justify-end gap-2 sm:hidden"><Button asChild variant="secondary"><Link to="/patients/$patientId" params={{ patientId: patient.id }}>Volver al paciente</Link></Button><Button asChild><Link to="/patients/$patientId/evaluation" params={{ patientId: patient.id }}>Nueva evaluación</Link></Button></div>
  </div>;
}
