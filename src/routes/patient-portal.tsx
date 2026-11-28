import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@/lib/router";
import { PageHeader } from "@/components/arca/ui-kit";
import { Section } from "@/components/arca/clinical";
import { Button } from "@/components/ui/button";
import { getMyAssignedExercises, getMyExerciseExecutions, recordAssignedExercise, type AssignedExercise, type ExerciseExecution } from "@/services/assigned-exercises";
import { appointmentDate } from "@/services/appointments";
import { getMyAppointments, savePreconsultationSymptoms, uploadPreconsultationDocument, savePreconsultationMetric, sendPreconsultation, type PatientAppointment } from "@/services/preconsultation";
import { submitSymptom, submitMetric, uploadPatientDocument } from "@/services/patient-portal";

export const Route = createFileRoute("/mi-espacio")({ component: PatientPortal });

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "No se pudo completar la operación."; }

function PatientPortal() {
  const [exercises, setExercises] = useState<AssignedExercise[]>([]);
  const [exerciseAppointment,setExerciseAppointment]=useState("");
  const [exerciseExecutions,setExerciseExecutions]=useState<ExerciseExecution[]>([]);
  const [exerciseLoadError,setExerciseLoadError]=useState("");
  const [myAppointments,setMyAppointments]=useState<PatientAppointment[]>([]);
  const [appointmentError,setAppointmentError]=useState("");
  const [selectedAppointment,setSelectedAppointment]=useState("");
  const [preSymptoms,setPreSymptoms]=useState("");
  const [preJoint,setPreJoint]=useState("");
  const [preSide,setPreSide]=useState("derecho");
  const [preFile,setPreFile]=useState<File|null>(null);
  const [preMin,setPreMin]=useState("");
  const [preMax,setPreMax]=useState("");
  const [symptomsSaved,setSymptomsSaved]=useState(false);
  const [sentThisSession,setSentThisSession]=useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [symptom, setSymptom] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [metric, setMetric] = useState({ articulacion: "", lado: "derecho", angulo_minimo: "", angulo_maximo: "" });

  async function refreshExerciseHistory(appointmentId: number) {
    const items = await getMyExerciseExecutions(appointmentId);
    setExerciseExecutions(items);
  }
  useEffect(() => {
    let mounted = true;
    setExercises([]);
    setExerciseExecutions([]);
    setExerciseLoadError("");
    if (!exerciseAppointment) { setLoading(false); return; }
    setLoading(true);
    const id = Number(exerciseAppointment);
    void Promise.all([getMyAssignedExercises(id),getMyExerciseExecutions(id)])
      .then(([assigned, executions]) => { if (mounted) {setExercises(assigned);setExerciseExecutions(executions);} })
      .catch(err => { if (mounted) setExerciseLoadError(errorMessage(err)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [exerciseAppointment]);
  async function loadMyAppointments(){try{setMyAppointments(await getMyAppointments());setAppointmentError("");}catch(e){setAppointmentError(errorMessage(e));}}
  useEffect(()=>{void loadMyAppointments();},[]);
  const selectedCita=myAppointments.find(c=>String(c.id)===selectedAppointment);
  const preconsultationSent=!!selectedCita?.preconsulta?.enviada || (selectedCita ? sentThisSession.includes(selectedCita.id) : false);
  const joints=selectedCita?.articulaciones ?? [];
  async function savePreSymptoms(e:FormEvent){e.preventDefault();if(!selectedCita)return;
    const data={descripcion:preSymptoms.trim(),articulacion:preJoint,lado:(preJoint.toLowerCase().includes("cervical") || preJoint.toLowerCase().includes("lumbar"))?undefined:preSide as "derecho"|"izquierdo"};
    await run(async()=>{await savePreconsultationSymptoms(selectedCita.id,data);setSymptomsSaved(true);},"Síntomas de esta cita guardados.");
  }
  async function savePreDocument(e:FormEvent){e.preventDefault();if(!selectedCita||!preFile)return;
    await run(async()=>{await uploadPreconsultationDocument(selectedCita.id,preFile);setPreFile(null);},"Documento de preconsulta enviado.");
  }
  async function savePreMetric(e:FormEvent){e.preventDefault();if(!selectedCita)return;
    if(preMin===""||preMax===""||Number(preMin)>Number(preMax)){setError("Revisa los ángulos mínimo y máximo.");return;}
    await run(()=>savePreconsultationMetric(selectedCita.id,{angulo_minimo:Number(preMin),angulo_maximo:Number(preMax)}),"Medición asociada a la cita.");
  }
  async function finishPreconsultation(){if(!selectedCita)return;
    if(!window.confirm("¿Enviar la preconsulta? Después de enviarla no podrás modificar los síntomas."))return;
    await run(async()=>{await sendPreconsultation(selectedCita.id);setSentThisSession(prev=>[...prev,selectedCita.id]);await loadMyAppointments();},"Preconsulta enviada. El análisis se procesará en el servidor.");
  }
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
    <Section title="Preconsulta de mi cita" description="Registra síntomas y mediciones asociados a una cita antes de enviarlos a evaluación.">
      <div className="mt-4 space-y-4">
        {appointmentError && <p role="alert" className="text-sm text-destructive">No se pudieron consultar tus citas: {appointmentError}</p>}
        <label className="block text-sm">Cita
          <select value={selectedAppointment} onChange={e=>{setSelectedAppointment(e.target.value);setPreJoint("");setPreSymptoms("");setSymptomsSaved(false);}} className="mt-1 w-full rounded-md border border-border bg-background p-2">
            <option value="">Selecciona una cita</option>
            {myAppointments.filter(c=>c.estado==="programada" && new Date(c.fecha_hora).getTime()>Date.now()).map(c=><option key={c.id} value={c.id}>{appointmentDate(c.fecha_hora)} — {c.especialidad_nombre}</option>)}
          </select>
        </label>
        {selectedCita && <div className="space-y-4 rounded-md border border-border p-3 sm:p-4">
          <p className="text-sm">Especialidad: <strong>{selectedCita.especialidad_nombre}</strong></p>
          {preconsultationSent ? <p role="status" className="text-sm font-semibold">Esta preconsulta ya fue enviada.</p> : <>
            <p className="text-xs text-muted-foreground">Los registros de preconsulta se guardan para esta cita.</p>
            <form onSubmit={e=>void savePreSymptoms(e)} className="space-y-3">
              <h3 className="font-semibold">1. Síntomas</h3>
              <label className="block text-sm">Articulación
                <select required value={preJoint} onChange={e=>{setPreJoint(e.target.value);setSymptomsSaved(false);}} className="mt-1 w-full rounded-md border border-border bg-background p-2"><option value="">Seleccionar</option>{joints.map(j=><option key={j} value={j}>{j}</option>)}</select>
              </label>
              {preJoint && !["cervical","lumbar"].some(x=>preJoint.toLowerCase().includes(x)) && <label className="block text-sm">Lado<select value={preSide} onChange={e=>setPreSide(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"><option value="derecho">Derecho</option><option value="izquierdo">Izquierdo</option></select></label>}
              <label className="block text-sm">Descripción<textarea required value={preSymptoms} onChange={e=>{setPreSymptoms(e.target.value);setSymptomsSaved(false);}} className="mt-1 w-full rounded-md border border-border bg-background p-2" rows={3}/></label>
              <Button type="submit" disabled={busy || !preJoint || !preSymptoms.trim()}>Guardar síntomas de la cita</Button>
            </form>
            <form onSubmit={e=>void savePreDocument(e)} className="space-y-2"><h3 className="font-semibold">2. Documento (opcional)</h3><input type="file" aria-label="Documento para preconsulta" onChange={e=>setPreFile(e.target.files?.[0]||null)} className="block w-full text-sm"/><Button type="submit" variant="secondary" disabled={busy || !preFile}>Adjuntar documento</Button></form>
            <form onSubmit={e=>void savePreMetric(e)} className="space-y-2"><h3 className="font-semibold">3. Medición articular (opcional)</h3><p className="text-xs text-muted-foreground">Primero registra los síntomas. La articulación y el lado se asociarán automáticamente.</p><div className="grid gap-2 sm:grid-cols-2"><label className="text-sm">Ángulo mínimo<input type="number" min={0} max={180} step="any" required value={preMin} onChange={e=>setPreMin(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label><label className="text-sm">Ángulo máximo<input type="number" min={0} max={180} step="any" required value={preMax} onChange={e=>setPreMax(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label></div><Button type="submit" variant="secondary" disabled={busy || !symptomsSaved}>Guardar medición</Button></form>
            <div className="border-t border-border pt-3"><Button type="button" disabled={busy || !symptomsSaved} onClick={()=>void finishPreconsultation()}>Enviar preconsulta</Button><p className="mt-2 text-xs text-muted-foreground">Al enviarla se inicia el procesamiento del prediagnóstico. No sustituye la evaluación de un profesional.</p></div>
          </>}
        </div>}
      </div>
    </Section>
    <Section title="Mis ejercicios asignados" description="Ejercicios prescritos para cada cita por tu médico.">
      <div className="mt-4 space-y-3">
        <label className="block text-sm">Cita
          <select value={exerciseAppointment} onChange={e=>{setExerciseAppointment(e.target.value);setError("");}} className="mt-1 w-full max-w-xl rounded-md border border-border bg-background p-2">
            <option value="">Selecciona una cita...</option>
            {myAppointments.filter(c=>c.estado!=="cancelada").map(c=><option key={c.id} value={c.id}>#{c.id} · {appointmentDate(c.fecha_hora)} · {c.especialidad_nombre}</option>)}
          </select>
        </label>
        {exerciseLoadError && <p role="alert" className="text-sm text-destructive">{exerciseLoadError}</p>}
        {!exerciseAppointment ? <p className="text-sm text-muted-foreground">Selecciona una cita para ver los ejercicios indicados por tu médico.</p>
          : loading ? <p className="text-sm text-muted-foreground">Cargando ejercicios asignados…</p>
          : exercises.length===0 ? <p className="text-sm text-muted-foreground">Todavía no hay ejercicios asignados para esta cita.</p>
          : exercises.map(ex => <div key={ex.id} className="rounded-md border border-border p-4 space-y-2">
            <h3 className="font-semibold">{ex.nombre_ejercicio}</h3>
            <p className="text-sm text-muted-foreground">{ex.articulacion} · {ex.descripcion || "Sin descripción"}</p>
            {ex.imagen_url && <div className="flex h-56 items-center justify-center rounded-md border border-border bg-muted/10 p-2"><img alt={`Ejercicio ${ex.nombre_ejercicio}`} className="h-full w-full object-contain" loading="lazy" src={ex.imagen_url.startsWith("http") ? ex.imagen_url : `${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")}/${ex.imagen_url.replace(/^\//, "")}`} /></div>}
            {ex.indicaciones && <p className="text-sm"><strong>Indicaciones del médico:</strong> {ex.indicaciones}</p>}
            <label className="block text-sm">Comentario (opcional)<textarea className="mt-1 w-full rounded-md border border-border bg-background p-2" value={comments[ex.id]||""} onChange={e=>setComments(v=>({...v,[ex.id]:e.target.value}))}/></label>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={()=>void run(async()=>{await recordAssignedExercise(Number(exerciseAppointment),ex.id,true,comments[ex.id]||"");await refreshExerciseHistory(Number(exerciseAppointment));},"Ejecución registrada como correcta.")}>Registrar correcta</Button>
              <Button variant="outline" disabled={busy} onClick={()=>void run(async()=>{await recordAssignedExercise(Number(exerciseAppointment),ex.id,false,comments[ex.id]||"");await refreshExerciseHistory(Number(exerciseAppointment));},"Ejecución registrada para revisión.")}>Registrar con dificultad</Button>
            </div>
          </div>)}
        {exerciseAppointment && !loading && <div className="mt-5 space-y-2 border-t border-border pt-4">
          <h3 className="font-semibold">Historial de ejercicios realizados</h3>
          {!exerciseExecutions.length ? <p className="text-sm text-muted-foreground">Todavía no hay ejecuciones registradas para esta cita.</p> :
            exerciseExecutions.map(entry=><div key={entry.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">{entry.nombre_ejercicio || exercises.find(ex=>ex.id===entry.ejercicio_id)?.nombre_ejercicio || `Ejercicio #${entry.ejercicio_id}`}</p>
              <p className="mt-1 text-muted-foreground">{new Date(entry.ejecutado_en).toLocaleString("es-CL")} · {entry.correcto ? "Realizado correctamente" : "Realizado con dificultad"}</p>
              {entry.comentario && <p className="mt-1 whitespace-pre-wrap">{entry.comentario}</p>}
            </div>)}
        </div>}
      </div>
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
  </div>;
}
