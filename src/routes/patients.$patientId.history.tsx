import { formatDisplayDate, useDateStyle } from "@/lib/display-preferences";
import { useEffect, useState } from "react";
import { Link, createFileRoute, usePathname } from "@/lib/router";
import { FileText, ArrowLeft } from "lucide-react";
import { Section } from "@/components/arca/clinical";
import { getPatientSymptoms, getPatientDocuments, type PatientSymptom, type PatientDocument } from "@/services/patient-detail";

export const Route = createFileRoute("/patients/$patientId/history")({
  head: () => ({ meta: [{ title: "Historial de síntomas y exámenes — ARCA Med" }] }),
  component: PatientHistory,
});

function displayDate(date: string) { return formatDisplayDate(date, true); }

function PatientHistory() {
  useDateStyle();
  const { patientId } = Route.useParams();
  const pathname = usePathname();
  const [tab, setTab] = useState<"sintomas"|"examenes">(() => new URLSearchParams(window.location.search).get("tab") === "examenes" ? "examenes" : "sintomas");
  const [symptoms,setSymptoms] = useState<PatientSymptom[]>([]);
  const [documents,setDocuments] = useState<PatientDocument[]>([]);
  const [loading,setLoading] = useState(true);
  const [errors,setErrors] = useState<string[]>([]);
  const id = Number(patientId);
  useEffect(() => {
    const chosen = new URLSearchParams(window.location.search).get("tab");
    if (chosen === "examenes" || chosen === "sintomas") setTab(chosen);
  }, [pathname]);
  useEffect(() => {
    let active = true;
    if (!Number.isSafeInteger(id) || id <= 0) { setErrors(["Identificador de paciente inválido."]); setLoading(false); return; }
    setLoading(true); setErrors([]);
    Promise.allSettled([getPatientSymptoms(id), getPatientDocuments(id)]).then(([s,d]) => {
      if (!active) return;
      if (s.status === "fulfilled") setSymptoms(s.value); else setErrors(prev=>[...prev,"No se pudo consultar el historial de síntomas."]);
      if (d.status === "fulfilled") setDocuments(d.value); else setErrors(prev=>[...prev,"No se pudo consultar el historial de exámenes."]);
    }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false};
  }, [id]);
  const symptomList = [...symptoms].sort((a,b)=>Date.parse(b.creado_en)-Date.parse(a.creado_en));
  const documentList = [...documents].sort((a,b)=>Date.parse(b.subido_en)-Date.parse(a.subido_en));
  return <div className="space-y-5">
    <Link to="/patients/$patientId" params={{patientId}} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4"/>Volver a la ficha</Link>
    <Section title="Historial del paciente" description="Síntomas y exámenes anteriores registrados en ARCA Med">
      <div role="tablist" aria-label="Tipo de historial" className="mt-4 flex gap-2">
        <button type="button" role="tab" aria-selected={tab==="sintomas"} onClick={()=>setTab("sintomas")} className={`rounded-md border px-4 py-2 text-sm ${tab==="sintomas"?"border-primary bg-primary/10 font-semibold text-primary":"border-border"}`}>Síntomas</button>
        <button type="button" role="tab" aria-selected={tab==="examenes"} onClick={()=>setTab("examenes")} className={`rounded-md border px-4 py-2 text-sm ${tab==="examenes"?"border-primary bg-primary/10 font-semibold text-primary":"border-border"}`}>Exámenes</button>
      </div>
      {loading && <p className="mt-4 text-sm text-muted-foreground">Cargando historial...</p>}
      {errors.map(err=><p key={err} role="alert" className="mt-3 text-sm text-destructive">{err}</p>)}
      {!loading && <div className="mt-4 space-y-3">
        {tab==="sintomas" ? (symptomList.length ? symptomList.map(s=><article key={s.id} className="rounded-md border border-border p-4"><p className="whitespace-pre-wrap text-sm">{s.descripcion}</p><p className="mt-2 text-xs text-muted-foreground">{displayDate(s.creado_en)}</p></article>) : <p className="text-sm text-muted-foreground">No hay síntomas registrados.</p>) : (documentList.length ? documentList.map(d=><article key={d.id} className="flex gap-3 rounded-md border border-border p-4"><FileText className="size-4 shrink-0 text-primary"/><div className="min-w-0"><p className="break-all text-sm font-medium">{d.nombre_archivo}</p><p className="mt-2 text-xs text-muted-foreground">{displayDate(d.subido_en)}</p></div></article>) : <p className="text-sm text-muted-foreground">No hay exámenes registrados.</p>)}
      </div>}
    </Section>
  </div>;
}
