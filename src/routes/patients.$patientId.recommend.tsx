import { Link, createFileRoute } from "@/lib/router";
import { ArrowLeft, Clock, Repeat2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, Field, PageHeader, SearchBox, SuccessPanel, TextArea, TextInput } from "@/components/arca/ui-kit";
import { exerciseDetailsFor } from "@/lib/mock-store";
import { useMockExercises, useMockPatients } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients/$patientId/recommend")({
  head: () => ({ meta: [
    { title: "Recomendar ejercicio — ARCA Med" },
    { name: "description", content: "Selecciona y asigna un ejercicio de rehabilitación al paciente." },
    { property: "og:title", content: "Recomendar ejercicio — ARCA Med" },
    { property: "og:description", content: "Prescripción de ejercicios de rehabilitación." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Recommend,
});

function Recommend() {
  const { patientId } = Route.useParams();
  const patient = useMockPatients().find((p) => p.id === patientId);
  const exercises = useMockExercises();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [assigned, setAssigned] = useState(false);
  if (!patient) return <BackButton to="/patients">Volver a pacientes</BackButton>;
  const categories = ["Todas", ...new Set(exercises.map((e) => e.region))];
  const shown = exercises.filter((e) => (category === "Todas" || e.region === category) && `${e.name} ${e.description} ${e.objective}`.toLowerCase().includes(query.toLowerCase()));
  const selected = exercises.find((e) => e.id === selectedId);
  const back = <BackButton to="/patients/$patientId" params={{ patientId }}>Volver a la ficha</BackButton>;

  if (assigned && selected) return <div className="py-6"><SuccessPanel title="Ejercicio asignado" description={`“${selected.name}” se asignó a ${patient.name}. El paciente recibirá las indicaciones en su plan de ejercicios.`}><Button asChild variant="secondary"><Link to="/patients/$patientId" params={{ patientId }}>Volver a la ficha</Link></Button><Button onClick={() => { setAssigned(false); setSelectedId(null); }}>Recomendar otro ejercicio</Button></SuccessPanel></div>;

  if (selected) {
    const d = exerciseDetailsFor(selected.id);
    const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setAssigned(true); window.scrollTo({ top: 0 }); };
    return <form onSubmit={submit} className="space-y-5">
      <PageHeader back={<Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}><ArrowLeft className="size-4" />Volver a la lista</Button>} eyebrow={`Paciente · ${patient.name}`} title="Recomendar ejercicio" description="Revisa y ajusta la prescripción antes de asignarla." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Section title="Resumen">
          <dl className="mt-3 space-y-3 text-sm"><div><dt className="text-[11px] text-muted-foreground">Paciente</dt><dd className="font-semibold">{patient.name} · {patient.id}</dd><dd className="text-xs text-muted-foreground">{patient.condition} · {patient.region}</dd></div><div><dt className="text-[11px] text-muted-foreground">Ejercicio seleccionado</dt><dd className="font-semibold">{selected.name}</dd><dd className="text-xs text-muted-foreground">{selected.region} · {selected.objective} · {selected.difficulty}</dd></div></dl>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{selected.description}</p>
        </Section>
        <Section title="Prescripción">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Instrucciones" className="sm:col-span-2"><TextArea defaultValue={d.instructions.join(" ")} maxLength={1000} /></Field>
            <Field label="Series"><TextInput type="number" min={1} max={10} defaultValue={d.sets} required /></Field>
            <Field label="Repeticiones"><TextInput type="number" min={1} max={50} defaultValue={d.reps} required /></Field>
            <Field label="Frecuencia"><TextInput defaultValue={d.frequency} maxLength={60} required /></Field>
            <Field label="Duración"><TextInput defaultValue={`${selected.duration} · 4 semanas`} maxLength={60} /></Field>
            <Field label="Observaciones" className="sm:col-span-2"><TextArea maxLength={500} placeholder="Indicaciones adicionales para el paciente" /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSelectedId(null)}>Cancelar</Button><Button type="submit"><Send className="size-4" />Asignar ejercicio</Button></div>
        </Section>
      </div>
    </form>;
  }

  return <div className="space-y-5">
    <PageHeader back={back} eyebrow={`Paciente · ${patient.name}`} title="Recomendar ejercicio" description={`Selecciona un ejercicio adecuado para ${patient.region.toLowerCase()}.`} />
    <div className="space-y-3 rounded-lg border border-border bg-card/75 p-4 shadow-clinical">
      <SearchBox value={query} onChange={setQuery} placeholder="Buscar ejercicios" />
      <div className="flex flex-wrap gap-2">{categories.map((c) => <button key={c} onClick={() => setCategory(c)} className={cn("rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground", category === c && "border-primary/20 bg-primary-soft text-primary")}>{c}</button>)}</div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((e) => <article key={e.id} className="flex flex-col rounded-lg border border-border bg-card/75 p-5 shadow-clinical backdrop-blur-md">
      <span className="text-[11px] font-semibold uppercase text-accent">{e.region}</span><h2 className="mt-1 text-base font-semibold">{e.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{e.description}</p>
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground"><span>{e.difficulty}</span><span className="flex items-center gap-1"><Clock className="size-3.5" />{e.duration}</span><span className="flex items-center gap-1"><Repeat2 className="size-3.5" />{e.repetitions}</span></div>
      <Button size="sm" className="mt-4" onClick={() => { setSelectedId(e.id); window.scrollTo({ top: 0 }); }}>Seleccionar</Button>
    </article>)}</div>
    {shown.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Ningún ejercicio coincide con la búsqueda.</p>}
  </div>;
}
