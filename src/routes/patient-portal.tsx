import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@/lib/router";
import { PageHeader } from "@/components/arca/ui-kit";
import { Section } from "@/components/arca/clinical";
import { Button } from "@/components/ui/button";
import type { Exercise } from "@/services/exercises";
import { listPatientExercises, recordExercise, submitSymptom, submitMetric, uploadPatientDocument } from "@/services/patient-portal";

export const Route = createFileRoute("/mi-espacio")({ component: PatientPortal });

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "No se pudo completar la operación."; }

function PatientPortal() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [symptom, setSymptom] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [metric, setMetric] = useState({ articulacion: "", lado: "derecho", angulo_minimo: "", angulo_maximo: "" });

  useEffect(() => { let mounted = true;
    listPatientExercises().then(items => {if(mounted) setExercises(items);}).catch(e=>{if(mounted) setError(errorMessage(e));}).finally(()=>{if(mounted) setLoading(false);});
    return () => {mounted=false;};
  }, []);
  async function run(task: () => Promise<unknown>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try { await task(); setNotice(success); } catch(e) { setError(errorMessage(e)); } finally {setBusy(false);}
  }
  async function saveSymptom(e: FormEvent) {e.preventDefault(); if(!symptom.trim()) return;
    await run(async()=>{await submitSymptom(symptom.trim());setSymptom("");},"Síntoma registrado. El prediagnóstico puede procesarse posteriormente.");
  }
  async function saveDocument(e: FormEvent) {e.preventDefault(); if(!document) return;
    await run(async()=>{await uploadPatientDocument(document);setDocument(null);},"Documento enviado correctamente.");
  }
  async function saveMetric(e: FormEvent) {e.preventDefault();
    const min=Number(metric.angulo_minimo), max=Number(metric.angulo_maximo);
    if(!metric.articulacion.trim() || metric.angulo_minimo==="" || metric.angulo_maximo==="" || min>max) {setError("Revisa la articulación y los ángulos ingresados.");return;}
    await run(()=>submitMetric({articulacion:metric.articulacion.trim(),lado:metric.lado,angulo_minimo:min,angulo_maximo:max}),"Métrica registrada correctamente.");
  }
  return <div className="space-y-5">
    <PageHeader eyebrow="Portal paciente" title="Mi espacio" description="Ejercicios e información que puedes registrar en ARCA Med." />
    {error && <div role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error}</div>}
    {notice && <div role="status" className="rounded-md border border-border bg-surface-raised p-3 text-sm">{notice}</div>}
    <Section title="Biblioteca de ejercicios" description="Consulta ejercicios y registra cada ejecución realizada.">
      <div className="mt-4 space-y-3">{loading ? <p className="text-sm text-muted-foreground">Cargando ejercicios…</p> : exercises.length===0 ? <p className="text-sm text-muted-foreground">No hay ejercicios disponibles.</p> : exercises.map(ex => <div key={ex.id} className="rounded-md border border-border p-4 space-y-2">
        <h3 className="font-semibold">{ex.nombre_ejercicio}</h3><p className="text-sm text-muted-foreground">{ex.articulacion} · {ex.descripcion || "Sin descripción"}</p>
        <label className="block text-sm">Comentario (opcional)<textarea className="mt-1 w-full rounded-md border border-border bg-background p-2" value={comments[ex.id]||""} onChange={e=>setComments(v=>({...v,[ex.id]:e.target.value}))}/></label>
        <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={()=>void run(()=>recordExercise(ex.id,true,comments[ex.id]||""),"Ejecución registrada como correcta.")}>Registrar correcta</Button><Button variant="outline" disabled={busy} onClick={()=>void run(()=>recordExercise(ex.id,false,comments[ex.id]||""),"Ejecución registrada para revisión.")}>Registrar con dificultad</Button></div>
      </div>)}</div>
    </Section>
    <Section title="Registrar síntomas" description="Envía una descripción de tus síntomas."><form onSubmit={e=>void saveSymptom(e)} className="mt-4 space-y-3"><textarea required value={symptom} onChange={e=>setSymptom(e.target.value)} className="w-full rounded-md border border-border bg-background p-3" placeholder="Describe tus molestias…"/><Button disabled={busy || !symptom.trim()} type="submit">Enviar síntomas</Button></form></Section>
    <Section title="Documentos" description="Adjunta un documento clínico permitido por el servidor."><form onSubmit={e=>void saveDocument(e)} className="mt-4 space-y-3"><input aria-label="Seleccionar documento" className="block w-full text-sm" type="file" onChange={e=>setDocument(e.target.files?.[0]||null)}/><Button disabled={busy || !document} type="submit">Subir documento</Button></form></Section>
    <Section title="Métricas físicas" description="Registra ángulos por articulación y lado."><form onSubmit={e=>void saveMetric(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Articulación<input required value={metric.articulacion} onChange={e=>setMetric(v=>({...v,articulacion:e.target.value}))} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
      <label className="text-sm">Lado<select className="mt-1 w-full rounded-md border border-border bg-background p-2" value={metric.lado} onChange={e=>setMetric(v=>({...v,lado:e.target.value}))}><option value="derecho">Derecho</option><option value="izquierdo">Izquierdo</option></select></label>
      <label className="text-sm">Ángulo mínimo<input type="number" required value={metric.angulo_minimo} onChange={e=>setMetric(v=>({...v,angulo_minimo:e.target.value}))} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
      <label className="text-sm">Ángulo máximo<input type="number" required value={metric.angulo_maximo} onChange={e=>setMetric(v=>({...v,angulo_maximo:e.target.value}))} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>Guardar métrica</Button></div>
    </form></Section>
    <Section title="Asignaciones e historial" description="Estas funciones todavía necesitan endpoints de consulta."><p className="mt-4 text-sm text-muted-foreground">Las ejecuciones se guardan en el servidor, pero todavía no es posible consultar aquí el historial ni las asignaciones del paciente. No se muestran registros de ejemplo.</p></Section>
  </div>;
}
