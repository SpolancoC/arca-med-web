import { Film, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { Field, SelectInput, TextArea, TextInput } from "@/components/arca/ui-kit";

export type ExerciseFormValues = {
  name: string; description: string; objective: string; region: string; muscleGroup: string; difficulty: string;
  sets: number; reps: number; duration: string; frequency: string; instructions: string[]; precautions: string; video?: string | undefined;
};

type VideoState = { name: string; url: string; duration: string; progress: number };

/** Formulario compartido para crear y editar ejercicios (mock; sin almacenamiento real del video). */
export function ExerciseForm({ initial, submitLabel, onSubmit, onCancel }: { initial: ExerciseFormValues; submitLabel: string; onSubmit: (values: ExerciseFormValues) => void; onCancel: () => void }) {
  const [values, setValues] = useState(initial);
  const [video, setVideo] = useState<VideoState | null>(null);
  const set = <K extends keyof ExerciseFormValues>(key: K, value: ExerciseFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  useEffect(() => {
    if (!video || video.progress >= 100) return;
    const t = window.setTimeout(() => setVideo((v) => v && { ...v, progress: Math.min(100, v.progress + 20) }), 250);
    return () => window.clearTimeout(t);
  }, [video]);

  function pickVideo(file?: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideo({ name: file.name, url, duration: "—", progress: 0 });
    set("video", file.name);
  }

  function submit(event: FormEvent) { event.preventDefault(); onSubmit({ ...values, instructions: values.instructions.filter((i) => i.trim()) }); }

  return <form onSubmit={submit} className="space-y-5">
    <Section title="Información básica">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del ejercicio" className="sm:col-span-2"><TextInput required maxLength={120} value={values.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Descripción" className="sm:col-span-2"><TextArea required maxLength={500} value={values.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Objetivo"><SelectInput options={["Movilidad", "Activación", "Fuerza", "Control motor"]} value={values.objective} onChange={(e) => set("objective", e.target.value)} /></Field>
        <Field label="Articulación"><SelectInput options={["Rodilla", "Hombro", "Columna lumbar", "Cadera", "Muñeca"]} value={values.region} onChange={(e) => set("region", e.target.value)} /></Field>
        <Field label="Grupo muscular"><TextInput required maxLength={100} value={values.muscleGroup} onChange={(e) => set("muscleGroup", e.target.value)} /></Field>
        <Field label="Dificultad"><SelectInput options={["Inicial", "Intermedio", "Avanzado"]} value={values.difficulty} onChange={(e) => set("difficulty", e.target.value)} /></Field>
      </div>
    </Section>
    <Section title="Parámetros">
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <Field label="Series"><TextInput type="number" min={1} max={20} required value={values.sets} onChange={(e) => set("sets", Number(e.target.value))} /></Field>
        <Field label="Repeticiones"><TextInput type="number" min={1} max={100} required value={values.reps} onChange={(e) => set("reps", Number(e.target.value))} /></Field>
        <Field label="Duración"><TextInput required maxLength={20} value={values.duration} onChange={(e) => set("duration", e.target.value)} placeholder="8 min" /></Field>
        <Field label="Frecuencia recomendada"><TextInput required maxLength={60} value={values.frequency} onChange={(e) => set("frequency", e.target.value)} /></Field>
      </div>
    </Section>
    <Section title="Instrucciones" description="Pasos en orden de ejecución." action={<Button type="button" size="sm" variant="secondary" onClick={() => set("instructions", [...values.instructions, ""])}><Plus className="size-3.5" />Agregar paso</Button>}>
      <ol className="mt-4 space-y-2">{values.instructions.map((step, i) => <li key={i} className="flex items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span><TextInput aria-label={`Paso ${i + 1}`} className="mt-0" maxLength={200} value={step} onChange={(e) => set("instructions", values.instructions.map((s, j) => j === i ? e.target.value : s))} /><Button type="button" variant="ghost" size="icon" aria-label={`Eliminar paso ${i + 1}`} onClick={() => set("instructions", values.instructions.filter((_, j) => j !== i))}><Trash2 className="size-4 text-muted-foreground" /></Button></li>)}</ol>
      <Field label="Precauciones (una por línea)" className="mt-4"><TextArea maxLength={800} value={values.precautions} onChange={(e) => set("precautions", e.target.value)} /></Field>
    </Section>
    <Section title="Video del ejercicio" description="El video será utilizado posteriormente para analizar el movimiento del ejercicio.">
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface-raised/60 p-6 text-center hover:bg-muted">
        <Upload className="size-6 text-primary" /><span className="text-sm font-semibold">Subir video</span><span className="text-xs text-muted-foreground">MP4, MOV o WebM · máximo 200 MB</span>
        <input type="file" accept="video/*" className="sr-only" onChange={(e) => pickVideo(e.target.files?.[0])} />
      </label>
      {video ? <div className="mt-4 grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
        <video src={video.url} className="aspect-video w-full rounded-md bg-muted object-cover" muted onLoadedMetadata={(e) => { const s = Math.round(e.currentTarget.duration || 0); setVideo((v) => v && { ...v, duration: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` }); }} />
        <div className="min-w-0 text-sm"><p className="flex items-center gap-2 truncate font-semibold"><Film className="size-4 shrink-0 text-primary" />{video.name}</p><p className="mt-1 text-xs text-muted-foreground">Duración: {video.duration}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-[width]" style={{ width: `${video.progress}%` }} /></div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground" role="status">{video.progress < 100 ? <><LoaderCircle className="size-3.5 animate-spin" />Cargando… {video.progress}%</> : "Carga completa · listo para análisis futuro"}</p></div>
      </div> : values.video && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Film className="size-4" />Video actual: {values.video}</p>}
    </Section>
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit">{submitLabel}</Button></div>
  </form>;
}
