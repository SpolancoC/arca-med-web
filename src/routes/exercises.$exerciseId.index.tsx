import { Link, createFileRoute } from "@/lib/router";
import { AlertTriangle, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, PageHeader, StatusPill } from "@/components/arca/ui-kit";
import { exerciseDetailsFor, useMockExercises } from "@/lib/mock-store";

export const Route = createFileRoute("/exercises/$exerciseId/")({
  head: () => ({ meta: [
    { title: "Revisar ejercicio — ARCA Med" },
    { name: "description", content: "Detalle clínico, video e instrucciones de un ejercicio de rehabilitación." },
    { property: "og:title", content: "Revisar ejercicio — ARCA Med" },
    { property: "og:description", content: "Revisión clínica de ejercicios en ARCA Med." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { exerciseId } = Route.useParams();
  const id = Number(exerciseId);
  const exercise = useMockExercises().find((e) => e.id === id);
  if (!exercise) return <div className="py-16 text-center"><p className="text-sm text-muted-foreground">Ejercicio no encontrado.</p><Button asChild variant="secondary" className="mt-4"><Link to="/exercises">Volver a la biblioteca</Link></Button></div>;
  const d = exerciseDetailsFor(id);
  const info = [["Articulación", exercise.region], ["Grupo muscular", d.muscleGroup], ["Objetivo", exercise.objective], ["Dificultad", exercise.difficulty], ["Duración", exercise.duration], ["Series", String(d.sets)], ["Repeticiones", String(d.reps)], ["Frecuencia", d.frequency]];
  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/exercises">Volver a la biblioteca</BackButton>} eyebrow="Revisar ejercicio" title={exercise.name} description={exercise.description}
      action={<Button asChild><Link to="/exercises/$exerciseId/edit" params={{ exerciseId }}><Pencil className="size-4" />Editar ejercicio</Link></Button>} />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Section title="Video de ejecución" description={d.video ? `Archivo: ${d.video}` : "Demostración de la ejecución correcta."}>
        <div className="mt-4 grid aspect-video place-items-center rounded-md border border-border bg-muted"><button type="button" aria-label="Reproducir video" className="grid size-14 place-items-center rounded-full bg-surface-raised text-primary shadow-clinical"><Play className="size-6" /></button></div>
      </Section>
      <Section title="Información del ejercicio" action={<StatusPill>{exercise.status}</StatusPill>}>
        <dl className="mt-4 grid grid-cols-2 gap-2">{info.map(([k, v]) => <div key={k} className="rounded-md bg-muted p-2.5"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm font-semibold">{v}</dd></div>)}</dl>
      </Section>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title="Instrucciones"><ol className="mt-4 space-y-2.5">{d.instructions.map((step, i) => <li key={i} className="flex gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>{step}</li>)}</ol></Section>
      <Section title="Consideraciones clínicas" description="Recomendaciones y precauciones para el profesional."><ul className="mt-4 space-y-2.5">{d.precautions.map((p) => <li key={p} className="flex gap-2.5 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-priority-high-foreground" />{p}</li>)}</ul></Section>
    </div>
  </div>;
}
