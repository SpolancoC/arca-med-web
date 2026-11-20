import { formatDisplayDate, useDateStyle } from "@/lib/display-preferences";
import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { ArrowLeft, FileText, Info, Dumbbell, Check, X, Plus } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import {
  getPatientSummary,
  getPatientSymptoms,
  getPatientDocuments,
  reviewPatientSummary,
  type PatientSummary,
  type PatientSymptom,
  type PatientDocument,
} from "@/services/patient-detail";


import { getExercises, type Exercise } from "@/services/exercises";
import { getMedicalPatients, type RegisteredPatient } from "@/services/patients";

export const Route = createFileRoute("/patients/$patientId/")({
  head: () => ({
    meta: [{ title: "Ficha del paciente — ARCA Med" }],
  }),
  component: PatientDetail,
});

type Priority = "High" | "Medium" | "Low";

function getPriority(value: string): Priority | null {
  switch (value.trim().toLowerCase()) {
    case "alta":
    case "high":
      return "High";
    case "media":
    case "medium":
      return "Medium";
    case "baja":
    case "low":
      return "Low";
    default:
      return null;
  }
}

// El backend almacena los diagnósticos como JSON; validamos su forma antes de mostrarlos.
function formatDifferential(value: unknown): { name: string; estimate?: number } | null {
  if (typeof value === "string" && value.trim()) {
    return { name: value.trim() };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.diagnostico !== "string" || !item.diagnostico.trim()) return null;
  const estimate = item.probabilidad;
  return {
    name: item.diagnostico.trim(),
    ...(typeof estimate === "number" && Number.isFinite(estimate) && estimate >= 0 && estimate <= 100
      ? { estimate }
      : {}),
  };
}

function formatMetricTime(value: string | null | undefined): string { return value ? formatDisplayDate(value, true) : "Fecha y hora no disponibles"; }

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function formatRecordDate(value: string): string | null { const date = formatDisplayDate(value); return date === "Fecha no disponible" ? null : date; }

function PatientDetail() {
  useDateStyle();
  const { patientId } = Route.useParams();
  const id = Number(patientId);

  const [patient, setPatient] = useState<RegisteredPatient | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [symptomsError, setSymptomsError] = useState<string | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryMissing, setSummaryMissing] = useState(false);
  const [summaryLoadError, setSummaryLoadError] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState<string | null>(null);
  const [exerciseRegion, setExerciseRegion] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [activeJoint, setActiveJoint] = useState("");
  const [summaryDecision, setSummaryDecision] = useState<"accepted" | "rejected" | null>(null);
  const [manualSummary, setManualSummary] = useState("");
  const [diagnosisDraft, setDiagnosisDraft] = useState("");
  const [chosenDiagnosis, setChosenDiagnosis] = useState("");
  const [diagnosisMode, setDiagnosisMode] = useState<"suggested" | "manual">("suggested");
  const [acceptedDiagnosis, setAcceptedDiagnosis] = useState("");
  const [confirmation, setConfirmation] = useState<"accept-summary" | "reject-summary" | "accept-diagnosis" | "reject-diagnosis" | null>(null);

  const [reviewing, setReviewing] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const isDoctor = localStorage.getItem("arca-med-role") === "medico";
  const fromDirectory = new URLSearchParams(window.location.search).get("desde") === "directorio";

  async function handleReviewSummary() {
    if (!isDoctor || !summary || reviewing) return;

    setReviewing(true);
    setReviewError(null);

    try {
      const result = await reviewPatientSummary(id);
      if (result.id !== id || result.revisado_por_medico !== true) {
        throw new Error("El servidor no confirmó la revisión del resumen. Comprueba el estado antes de intentarlo nuevamente.");
      }
      setReviewSuccess(true);
      setSummaryDecision("accepted");
    } catch (err) {
      setReviewError(
        err instanceof Error
          ? err.message
          : "No fue posible revisar el resumen.",
      );
    } finally {
      setReviewing(false);
    }
  }

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError("Identificador de paciente inválido.");
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError(null);
    setSummary(null);
    setPatient(null);
    setPatientError(null);
    setReviewSuccess(false);
    setReviewError(null);
    setSummaryDecision(null);
    setManualSummary("");
    setDiagnosisDraft("");
    setChosenDiagnosis("");
    setDiagnosisMode("suggested");
    setAcceptedDiagnosis("");
    setExerciseRegion("");
    setSelectedExercises([]);
    setActiveJoint("");
    setSummaryMissing(false);
    setSummaryLoadError(false);
    setSymptoms([]);
    setDocuments([]);
    setSymptomsError(null);
    setDocumentsError(null);

    async function loadPatient() {
      // GET /pacientes es la fuente de identidad del directorio medico.
      // No mostramos datos clinicos cuando el ID no corresponde a un paciente activo.
      try {
        const registered = await getMedicalPatients();
        if (!active) return;

        const selected = registered.find((entry) => entry.id === id);
        if (!selected) {
          setPatientError("El paciente no se encuentra en el directorio médico de pacientes activos.");
          setLoading(false);
          return;
        }
        setPatient(selected);
      } catch (err) {
        if (!active) return;
        setPatientError(err instanceof Error ? err.message : "No se pudo verificar la identidad del paciente.");
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        getPatientSummary(id),
        getPatientSymptoms(id),
        getPatientDocuments(id),
      ]);

      if (!active) return;

      const [summaryResult, symptomsResult, documentsResult] = results;

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        const status = (summaryResult.reason as { status?: number })?.status;

        if (status === 404) {
          setSummaryMissing(true);
        } else {
          setSummaryLoadError(true);
          setError("No se pudo cargar el resumen clínico.");
        }
      }

      if (symptomsResult.status === "fulfilled") {
        setSymptoms(symptomsResult.value);
      } else {
        setSymptomsError("No fue posible cargar los síntomas. Intenta volver a abrir la ficha.");
      }

      if (documentsResult.status === "fulfilled") {
        setDocuments(documentsResult.value);
      } else {
        setDocumentsError("No fue posible cargar los documentos. Intenta volver a abrir la ficha.");
      }

      setLoading(false);
    }

    void loadPatient();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadExercises() {
      setExercisesLoading(true);
      setExercisesError(null);

      try {
        const data = await getExercises();

        if (active) {
          setExercises(data);
        }
      } catch (err) {
        if (active) {
          setExercisesError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los ejercicios.",
          );
        }
      } finally {
        if (active) {
          setExercisesLoading(false);
        }
      }
    }

    // El backend (6) autoriza GET /ejercicios también para médicos.
    void loadExercises();

    return () => {
      active = false;
    };
  }, []);

  async function confirmAction() {
    if (confirmation === "accept-summary") {
      setConfirmation(null);
      await handleReviewSummary();
    } else if (confirmation === "reject-summary") {
      setSummaryDecision("rejected");
      setConfirmation(null);
    } else if (confirmation === "accept-diagnosis") {
      setAcceptedDiagnosis(chosenDiagnosis);
      setDiagnosisMode("suggested");
      setDiagnosisDraft("");
      setConfirmation(null);
    } else if (confirmation === "reject-diagnosis") {
      setDiagnosisMode("manual");
      setAcceptedDiagnosis("");
      setDiagnosisDraft("");
      setConfirmation(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Cargando ficha clínica...
      </div>
    );
  }

  if (!Number.isSafeInteger(id) || id <= 0) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!patient) {
    return (
      <div className="space-y-5">
        {isDoctor && (
          <Link
            to={fromDirectory ? "/patients" : "/triage"}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            {fromDirectory ? "Volver a Pacientes" : "Volver a Triaje"}
          </Link>
        )}
        <div role="alert" className="rounded-lg border border-destructive/30 bg-card/75 p-5 text-sm text-destructive shadow-clinical">
          {patientError || "No fue posible identificar a este paciente."}
        </div>
      </div>
    );
  }

  const priority = summary ? getPriority(summary.urgencia_sugerida) : null;
  const sortedSymptoms = [...symptoms].sort((a, b) =>
    Date.parse(b.creado_en) - Date.parse(a.creado_en));
  const sortedDocuments = [...documents].sort((a, b) =>
    Date.parse(b.subido_en) - Date.parse(a.subido_en));
  const lastDocumentDay = sortedDocuments[0]?.subido_en?.slice(0, 10);
  const recentDocuments = sortedDocuments.filter((doc) => doc.subido_en.slice(0, 10) === lastDocumentDay);
  const olderDocuments = sortedDocuments.length > recentDocuments.length;
  const jointNames = [...new Set((summary?.metricas_fisicas ?? []).map((m) => m.articulacion))];
  const joint = jointNames.includes(activeJoint) ? activeJoint : (jointNames[0] ?? "");
  const jointMetrics = (summary?.metricas_fisicas ?? [])
    .filter((m) => m.articulacion === joint)
    .sort((a, b) => {
      const dateA = a.medido_en ? Date.parse(a.medido_en) : NaN;
      const dateB = b.medido_en ? Date.parse(b.medido_en) : NaN;
      return Number.isFinite(dateA) && Number.isFinite(dateB) ? dateA - dateB : 0;
    });
  const chartData = jointMetrics.map((metric, index) => ({
    registro: metric.medido_en && Number.isFinite(Date.parse(metric.medido_en))
      ? formatMetricTime(metric.medido_en)
      : `Registro ${index + 1}`,
    fecha: formatMetricTime(metric.medido_en),
    minimo: Number(metric.angulo_minimo),
    maximo: Number(metric.angulo_maximo),
  }));
  const exerciseRegions = [...new Set(exercises.map((exercise) => exercise.articulacion))]
    .filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));
  const activeDiagnosis = diagnosisMode === "manual" ? diagnosisDraft : (acceptedDiagnosis || chosenDiagnosis);
  // Coincidencias orientativas por articulación: no equivalen a prescripción automática.
  const diagnosisSuggestedRegions = exerciseRegions.filter((region) => {
    const normalizedRegion = normalizeText(region);
    const normalizedDiagnosis = normalizeText(activeDiagnosis);
    if (!normalizedDiagnosis) return false;
    const aliases: Record<string, string[]> = {
      hombro: ["hombro", "manguito", "supraespinoso", "rotador"],
      codo: ["codo", "epicondil", "epitrocle"],
      muneca: ["muneca", "carpo", "tunel carpiano"],
      mano: ["mano", "dedo", "falange"],
      cadera: ["cadera", "coxofemoral", "glute"],
      rodilla: ["rodilla", "rotula", "patel", "menisc", "ligamento cruzado"],
      tobillo: ["tobillo", "aquiles", "maleolo"],
      pie: ["pie", "plantar", "metatarso", "talon"],
      columna: ["columna", "lumbar", "cervical", "dorsal", "espalda"],
    };
    if (normalizedDiagnosis.includes(normalizedRegion)) return true;
    return Object.entries(aliases).some(([key, words]) =>
      (normalizedRegion.includes(key) || key.includes(normalizedRegion)) &&
      words.some((word) => normalizedDiagnosis.includes(word))
    );
  });
  const visibleExercises = exerciseRegion
    ? exercises.filter((exercise) => normalizeText(exercise.articulacion) === normalizeText(exerciseRegion))
    : [];
  const diagnosisOptions = (summary?.diagnosticos_diferenciales ?? []).map(formatDifferential).filter((item): item is {name: string; estimate?: number} => item !== null);
  const triageTone = priority === "High" ? "border-red-500 border-l-[6px] bg-red-100 text-red-950 dark:bg-red-950/40 dark:text-red-100" : priority === "Medium" ? "border-yellow-500 border-l-[6px] bg-yellow-100 text-yellow-950 dark:bg-yellow-950/40 dark:text-yellow-100" : priority === "Low" ? "border-green-600 border-l-[6px] bg-green-100 text-green-950 dark:bg-green-950/40 dark:text-green-100" : "border-border bg-muted/30";

  return (
    <div className="space-y-5">
      {isDoctor && (
        <Link to={fromDirectory ? "/patients" : "/triage"} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> {fromDirectory ? "Volver a Pacientes" : "Volver a Triaje"}
        </Link>
      )}
      <header className="rounded-lg border border-border bg-card/75 p-5 shadow-clinical">
        <p className="text-xs font-semibold uppercase text-accent">Ficha clínica</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Paciente: {patient.nombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{patient.email}</p>
      </header>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Síntomas registrados" description="Último registro del paciente">
          <div className="mt-4 space-y-3 text-sm">
            {symptomsError ? <p role="alert" className="text-destructive">{symptomsError}</p> : sortedSymptoms.length ? (
              <>
                <p className="whitespace-pre-wrap break-words">{sortedSymptoms[0].descripcion}</p>
                <p className="text-xs text-muted-foreground">Registrado el {formatRecordDate(sortedSymptoms[0].creado_en) ?? "fecha no disponible"}</p>
                {sortedSymptoms.length > 1 && (
                  <Link to="/patients/$patientId/history" params={{patientId}} search={{tab:"sintomas"}} className="block border-t border-border pt-3 font-medium text-primary hover:underline">Ver historial de síntomas ({sortedSymptoms.length - 1} anteriores) →</Link>
                )}
              </>
            ) : <p className="text-muted-foreground">Este paciente no tiene síntomas registrados.</p>}
          </div>
        </Section>
        <Section title="Exámenes" description="Archivos de la fecha más reciente">
          <div className="mt-4 space-y-3 text-sm">
            {documentsError ? <p role="alert" className="text-destructive">{documentsError}</p> : recentDocuments.length ? (
              <>
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-2 rounded-md border border-border p-3">
                    <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0"><p className="break-all font-medium">{doc.nombre_archivo}</p><p className="text-xs text-muted-foreground">{formatRecordDate(doc.subido_en) ?? "Fecha no disponible"}</p></div>
                  </div>
                ))}
                {olderDocuments && (
                  <Link to="/patients/$patientId/history" params={{patientId}} search={{tab:"examenes"}} className="block border-t border-border pt-3 font-medium text-primary hover:underline">Ver exámenes anteriores ({sortedDocuments.length - recentDocuments.length}) →</Link>
                )}
              </>
            ) : <p className="text-muted-foreground">Este paciente no tiene exámenes registrados.</p>}
          </div>
        </Section>
      </div>

      <Section title="Triaje generado por IA" description="Información orientativa para revisión y decisión del profesional">
        <div className="mt-4 space-y-5">
          <div className={`rounded-lg border p-4 ${triageTone}`}>
            <div className="flex flex-wrap items-center gap-3"><strong className="text-sm">Sugerencia de triaje</strong>{priority && <span className={`rounded-full px-3 py-1 text-xs font-bold ${priority === "High" ? "bg-red-600 text-white" : priority === "Medium" ? "bg-yellow-400 text-yellow-950" : "bg-green-600 text-white"}`}>{priority === "High" ? "ALTA" : priority === "Medium" ? "MEDIA" : "BAJA"}</span>}</div>
            <p className="mt-2 text-sm">{summary ? `Prioridad sugerida: ${summary.urgencia_sugerida}` : summaryMissing ? "Este paciente aún no tiene triaje generado." : summaryLoadError ? "No se pudo consultar el triaje." : "No hay información de triaje."}</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold">Resumen clínico generado por IA</h3>
            {summaryDecision === "rejected" ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Resumen rechazado en esta sesión. Puedes redactar uno manualmente, pero todavía no se guarda en el backend.</p>
                <textarea className="w-full rounded-md border border-border bg-background p-3 text-sm" rows={5} placeholder="Redactar resumen clínico (opcional)" value={manualSummary} onChange={(e)=>setManualSummary(e.target.value)} />
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{summary?.resumen_generado || "No hay resumen clínico disponible."}</p>
            )}
            {reviewSuccess && <p role="status" className="mt-3 text-sm text-emerald-700">Revisión aceptada y registrada en el backend. La API no devuelve aún el estado de revisión al volver a entrar.</p>}
            {isDoctor && summary && !reviewSuccess && summaryDecision !== "rejected" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={reviewing} onClick={()=>setConfirmation("accept-summary")}><Check className="mr-1 size-4"/>Aceptar resumen</Button>
                <Button disabled={reviewing} variant="secondary" onClick={()=>setConfirmation("reject-summary")}><X className="mr-1 size-4"/>Rechazar resumen</Button>
              </div>
            )}
            {reviewError && <p role="alert" className="mt-3 text-sm text-destructive">{reviewError}</p>}
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Info className="size-4 shrink-0"/>La IA es apoyo clínico; la responsabilidad de confirmar el contenido corresponde al médico. El backend aún no admite persistir rechazos ni texto manual.</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold">Diagnósticos diferenciales sugeridos</h3>
            <p className="mt-1 text-xs text-muted-foreground">Son hipótesis generadas por IA, no diagnósticos confirmados.</p>
            <div className="mt-3 space-y-2">
              {diagnosisOptions.length ? diagnosisOptions.map((item,index) => (
                <label key={`${item.name}-${index}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm">
                  <input type="radio" name="suggested-diagnosis" checked={chosenDiagnosis===item.name} onChange={()=>setChosenDiagnosis(item.name)} />
                  <span>{item.name}{item.estimate !== undefined ? ` · estimación IA ${item.estimate}%` : ""}</span>
                </label>
              )) : <p className="text-sm text-muted-foreground">No hay diagnósticos diferenciales disponibles.</p>}
            </div>
            {isDoctor && diagnosisMode === "suggested" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={!chosenDiagnosis} onClick={() => setConfirmation("accept-diagnosis")}>Aceptar diagnóstico seleccionado</Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmation("reject-diagnosis")}>Rechazar sugerencias y escribir manualmente</Button>
              </div>
            )}
            {diagnosisMode === "manual" ? (
              <div className="mt-4">
                <label htmlFor="diagnosis-manual" className="block text-sm font-medium">Diagnóstico clínico manual</label>
                <textarea id="diagnosis-manual" rows={2} value={diagnosisDraft} onChange={(e) => setDiagnosisDraft(e.target.value)} placeholder="Escribe el diagnóstico del profesional (opcional)" className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm" />
                <p className="mt-2 text-xs text-muted-foreground">Disponible tras rechazar las sugerencias. Aún no se guarda en el servidor.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setDiagnosisMode("suggested"); setDiagnosisDraft(""); }}>Volver a sugerencias de IA</Button>
              </div>
            ) : acceptedDiagnosis ? (
              <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
                <strong>Diagnóstico seleccionado:</strong> {acceptedDiagnosis}
                <p className="mt-1 text-xs">Selección provisional de esta sesión; no se guarda aún en el backend.</p>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      <Section title="Rango de movimiento" description="Mediciones por articulación disponibles desde el backend">
        <div className="mt-4 space-y-4">
          {jointNames.length ? (
            <>
              <div role="tablist" aria-label="Articulaciones" className="flex flex-wrap gap-2">
                {jointNames.map((name) => <button key={name} type="button" role="tab" aria-selected={joint===name} onClick={()=>setActiveJoint(name)} className={`rounded-md border px-3 py-2 text-sm ${joint===name ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border"}`}>{name}</button>)}
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="py-2">Registro</th><th>Fecha y hora</th><th>Ángulo mínimo</th><th>Ángulo máximo</th></tr></thead><tbody>{jointMetrics.map((m,i)=><tr key={i} className="border-b border-border"><td className="py-2">{i+1}</td><td className="pr-4">{formatMetricTime(m.medido_en)}</td><td>{m.angulo_minimo}°</td><td>{m.angulo_maximo}°</td></tr>)}</tbody></table></div>
              <div className="rounded-md border border-border p-3">
                <h3 className="text-sm font-semibold">Comparación de mediciones · {joint}</h3>
                {chartData.length > 0 ? (
                  <div className="mt-3 h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="registro"/><YAxis unit="°"/><Tooltip labelFormatter={(label, payload) => payload?.[0]?.payload?.fecha ? `${String(label)} · ${payload[0].payload.fecha}` : String(label)} /><Legend/><Line dataKey="minimo" name="Mínimo" stroke="#0d9488" strokeWidth={2} dot={{r: 5}} activeDot={{r: 7}}/><Line dataKey="maximo" name="Máximo" stroke="#2563eb" strokeWidth={2} dot={{r: 5}} activeDot={{r: 7}}/></LineChart></ResponsiveContainer></div>
                ) : <p className="mt-3 text-sm text-muted-foreground">Solo existe un registro para esta articulación. Se necesitan más mediciones para comparar.</p>}
                <p className="mt-3 text-xs text-muted-foreground">Cada punto representa una medición, incluso si solo hay una. El backend actual no incluye fecha y hora (medido_en) en /resumen, por lo que el orden todavía no acredita una evolución cronológica. Cuando se exponga medido_en, se mostrará aquí sin alterar este componente.</p>
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground">No hay mediciones registradas.</p>}
        </div>
      </Section>

      <Section title="Ejercicios de rehabilitación" description="Selección clínica desde la biblioteca de ejercicios">
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <select value={exerciseRegion} onChange={(e)=>setExerciseRegion(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Seleccionar articulación...</option>
              {exerciseRegions.map((r)=><option key={r} value={r}>{r}</option>)}
            </select>

          </div>
          {diagnosisSuggestedRegions.length > 0 && <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
            <p className="font-semibold">Articulaciones posiblemente relacionadas con el diagnóstico</p>
            <div className="mt-2 flex flex-wrap gap-2">{diagnosisSuggestedRegions.map(region => <Button key={region} type="button" size="sm" variant="secondary" onClick={() => setExerciseRegion(region)}>{region}</Button>)}</div>
            <p className="mt-2 text-xs text-muted-foreground">Coincidencia por términos del diagnóstico, no recomendación clínica automática. El médico debe verificar si corresponde.</p>
          </div>}
          <p className="text-xs text-muted-foreground">Primero selecciona una articulación para consultar sus ejercicios. El guardado de pautas requiere una API adicional.</p>
          {exercisesLoading && <p className="text-sm text-muted-foreground">Cargando ejercicios...</p>}
          {exercisesError && <p role="alert" className="text-sm text-destructive">{exercisesError}</p>}
          {!exerciseRegion && !exercisesLoading && !exercisesError && <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Selecciona una articulación para mostrar ejercicios disponibles.</p>}
          {Boolean(exerciseRegion) && !exercisesLoading && !exercisesError && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleExercises.map((exercise)=>{
              const selected = selectedExercises.includes(exercise.id);
              return <div key={exercise.id} className="flex flex-col rounded-md border border-border p-3 text-sm">
                <p className="flex items-center gap-2 font-semibold"><Dumbbell className="size-4"/>{exercise.nombre_ejercicio}</p>
                <p className="mt-1 text-xs text-muted-foreground">{exercise.articulacion}</p>
                {exercise.imagen_url && (
                  <div className="mt-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted/10 p-2 sm:h-56">
                    <img
                      src={exercise.imagen_url.startsWith("http")
                        ? exercise.imagen_url
                        : `${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")}/${exercise.imagen_url.replace(/^\//, "")}`}
                      alt={`Imagen del ejercicio ${exercise.nombre_ejercicio}`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                )}
                <p className="mt-2 flex-1 whitespace-pre-wrap text-xs text-muted-foreground">{exercise.descripcion || "Sin descripción"}</p>
                <Button className="mt-3" size="sm" variant={selected ? "secondary" : "primary"} onClick={()=>setSelectedExercises(prev=>selected ? prev.filter(x=>x!==exercise.id) : [...prev,exercise.id])}>{selected ? <><X className="mr-1 size-3"/>Quitar de la lista</> : <><Plus className="mr-1 size-3"/>Agregar a la lista</>}</Button>
              </div>;
            })}
            {!visibleExercises.length && <p className="text-sm text-muted-foreground">No hay ejercicios en esta categoría.</p>}
          </div>}
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <h3 className="font-semibold">Lista de ejercicios seleccionados ({selectedExercises.length})</h3>
            {selectedExercises.length ? <ul className="mt-3 space-y-2">{selectedExercises.map(exerciseId=>{ const ex=exercises.find(e=>e.id===exerciseId);return ex ? <li key={exerciseId} className="flex items-center justify-between gap-2 text-sm"><span>{ex.nombre_ejercicio} · {ex.articulacion}</span><button type="button" className="text-primary hover:underline" onClick={()=>setSelectedExercises(prev=>prev.filter(x=>x!==exerciseId))}>Quitar</button></li> : null; })}</ul> : <p className="mt-2 text-sm text-muted-foreground">Todavía no has agregado ejercicios.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Selección temporal: todavía no se ha asignado ni guardado en el servidor.</p>
          </div>
        </div>
      </Section>

      {confirmation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
        <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
          <h2 id="confirm-title" className="text-lg font-semibold">Confirmar decisión</h2>
          <p className="mt-3 text-sm">{confirmation==="accept-summary" ? "¿Deseas aceptar este resumen y registrar su revisión médica en el servidor?" : confirmation==="reject-summary" ? "¿Deseas rechazar el resumen de IA? Podrás escribir otro o dejarlo en blanco. El rechazo no se guardará todavía en el backend." : confirmation === "reject-diagnosis" ? "¿Deseas rechazar los diagnósticos sugeridos por IA y habilitar el ingreso manual? La elección solo permanecerá en esta sesión." : `¿Deseas utilizar «${chosenDiagnosis}» como diagnóstico provisional? No se guardará todavía en el backend.`}</p>
          <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setConfirmation(null)}>Cancelar</Button><Button disabled={reviewing} onClick={()=>void confirmAction()}>Confirmar</Button></div>
        </div>
      </div>}
    </div>
  );
}
