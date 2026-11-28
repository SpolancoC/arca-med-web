import { formatDisplayDate, useDateStyle } from "@/lib/display-preferences";
import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { ArrowLeft, FileText, Info, Dumbbell, Check, X, Plus, ClipboardList, Activity } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { PatientDocumentOpenButton } from "@/components/arca/patient-document-open-button";
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
import { listAppointments, appointmentDate, type Appointment } from "@/services/appointments";
import { getAssignedExercises, getDoctorExerciseExecutions, saveAssignedExercises, type ExerciseExecution } from "@/services/assigned-exercises";

export const Route = createFileRoute("/patients/$patientId/")({
  head: () => ({
    meta: [{ title: "Ficha del paciente — ARCA Med" }],
  }),
  component: PatientDetail,
});

type ClinicalTab = "anamnesis" | "evaluacion" | "ejercicios";

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
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsSaving, setAssignmentsSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);
  const [exerciseExecutions,setExerciseExecutions] = useState<ExerciseExecution[]>([]);
  const [assignmentsDirty, setAssignmentsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<ClinicalTab>("anamnesis");
  const [activeJoint, setActiveJoint] = useState("");
  const [activeSide, setActiveSide] = useState("");
  const [summaryDecision, setSummaryDecision] = useState<"accepted" | "rejected" | null>(null);
  const [manualSummary, setManualSummary] = useState("");
  const [diagnosisDraft, setDiagnosisDraft] = useState("");
  const [chosenDiagnosis, setChosenDiagnosis] = useState("");
  const [diagnosisMode, setDiagnosisMode] = useState<"suggested" | "manual">("suggested");
  const [acceptedDiagnosis, setAcceptedDiagnosis] = useState("");
  const [confirmation, setConfirmation] = useState<"accept-summary" | "reject-summary" | "accept-diagnosis" | "reject-diagnosis" | null>(null);

  const [reviewing, setReviewing] = useState(false);
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);

  const isDoctor = localStorage.getItem("arca-med-role") === "medico";
  const fromDirectory = new URLSearchParams(window.location.search).get("desde") === "directorio";

  async function handleReviewSummary() {
    if (!isDoctor || !summary || reviewing) return;

    setReviewing(true);
    setSummaryError(null);
    setSummaryNotice(null);

    try {
      const result = await reviewPatientSummary(id);
      if (result.revisado_por_medico !== true) {
        throw new Error("El servidor no confirmó la revisión del resumen. Comprueba el estado antes de intentarlo nuevamente.");
      }
      setSummaryDecision("accepted");
      setSummaryNotice("Resumen revisado correctamente.");
      setSummary(current => current ? { ...current, revisado_por_medico: result.revisado_por_medico, estado_revision: result.estado_revision } : current);
    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : "No fue posible revisar el resumen.",
      );
    } finally {
      setReviewing(false);
    }
  }

  async function saveDiagnosis(decision: { diagnostico_seleccionado?: string; diagnostico_manual?: string }) {
    if (!isDoctor || !summary || reviewing) return;
    setReviewing(true);
    setDiagnosisError(null);
    try {
      const result = await reviewPatientSummary(id, decision);
      if (result.estado_revision !== "confirmado") throw new Error("No se confirmó el diagnóstico.");
      setSummary(current => current ? { ...current, ...result } : current);
      setAcceptedDiagnosis(result.diagnostico_seleccionado || "");
      setChosenDiagnosis(result.diagnostico_seleccionado || "");
      setDiagnosisDraft(result.diagnostico_manual || "");
      setDiagnosisMode(result.diagnostico_manual ? "manual" : "suggested");
    } catch (err) {
      setDiagnosisError(err instanceof Error ? err.message : "No se pudo guardar el diagnóstico.");
    } finally {
      setReviewing(false);
    }
  }

  async function saveExerciseAssignment() {
    const appointmentId = Number(selectedAppointmentId);
    if (!isDoctor || !Number.isSafeInteger(appointmentId) || assignmentsSaving || assignmentsLoading) return;
    if (!window.confirm("¿Guardar esta lista de ejercicios para la cita? Reemplazará la asignación anterior.")) return;
    setAssignmentsSaving(true);
    setAssignmentError(null);
    setAssignmentNotice(null);
    try {
      const saved = await saveAssignedExercises(appointmentId, selectedExercises);
      setSelectedExercises([...new Set(saved.map(item => item.id))]);
      setAssignmentsDirty(false);
      setAssignmentNotice("Ejercicios guardados para esta cita. El paciente podrá consultarlos desde su aplicación.");
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "No se pudo guardar la asignación.");
    } finally { setAssignmentsSaving(false); }
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
    setSummaryNotice(null);
    setSummaryError(null);
    setDiagnosisError(null);
    setSummaryDecision(null);
    setManualSummary("");
    setDiagnosisDraft("");
    setChosenDiagnosis("");
    setDiagnosisMode("suggested");
    setAcceptedDiagnosis("");
    setExerciseRegion("");
    setSelectedExercises([]);
    setActiveTab("anamnesis");
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
        setAcceptedDiagnosis(summaryResult.value.diagnostico_seleccionado || "");
        setChosenDiagnosis(summaryResult.value.diagnostico_seleccionado || "");
        setDiagnosisDraft(summaryResult.value.diagnostico_manual || "");
        setDiagnosisMode(summaryResult.value.diagnostico_manual ? "manual" : "suggested");
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

  useEffect(() => {
    let active = true;
    setPatientAppointments([]);
    setSelectedAppointmentId("");
    if (!isDoctor || !Number.isSafeInteger(id) || id <= 0) return;
    void listAppointments({ paciente_id: id }).then(items => {
      if (active) setPatientAppointments(items.filter(item => item.estado !== "cancelada"));
    }).catch(err => { if (active) setAssignmentError(err instanceof Error ? err.message : "No se pudieron cargar las citas."); });
    return () => { active = false; };
  }, [id, isDoctor]);

  useEffect(() => {
    let active = true;
    setSelectedExercises([]);
    setExerciseExecutions([]);
    setAssignmentsDirty(false);
    setAssignmentNotice(null);
    setAssignmentError(null);
    if (!selectedAppointmentId) return;
    setAssignmentsLoading(true);
    void Promise.all([getAssignedExercises(Number(selectedAppointmentId)), getDoctorExerciseExecutions(Number(selectedAppointmentId))])
      .then(([items, executions]) => {
        if (active) {setSelectedExercises([...new Set(items.map(item => item.id))]);setExerciseExecutions(executions);}
      }).catch(err => { if (active) setAssignmentError(err instanceof Error ? err.message : "No se pudieron cargar los ejercicios y su historial."); })
      .finally(() => { if (active) setAssignmentsLoading(false); });
    return () => { active = false; };
  }, [selectedAppointmentId]);

  async function confirmAction() {
    if (confirmation === "accept-summary") {
      setConfirmation(null);
      await handleReviewSummary();
    } else if (confirmation === "reject-summary") {
      setSummaryDecision("rejected");
      setSummaryNotice(null);
      setSummaryError(null);
      setConfirmation(null);
    } else if (confirmation === "accept-diagnosis") {
      setConfirmation(null);
      await saveDiagnosis({ diagnostico_seleccionado: chosenDiagnosis });
    } else if (confirmation === "reject-diagnosis") {
      setDiagnosisMode("manual");
      setDiagnosisDraft(summary?.diagnostico_manual || "");
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
  // Las series se separan solo cuando la medición trae su lateralidad real.
  const metricJointNames = [...new Set((summary?.metricas_fisicas ?? []).map(m => m.articulacion))];
  const joint = metricJointNames.includes(activeJoint) ? activeJoint : (metricJointNames[0] ?? "");
  const jointMetrics = (summary?.metricas_fisicas ?? []).filter(m => m.articulacion === joint);
  const sideGroups = [
    { key: "derecho", label: "Derecha" },
    { key: "izquierdo", label: "Izquierda" },
    { key: "sin-lado", label: "Lado sin registrar" },
  ].map(group => {
    const metrics = jointMetrics.filter(metric => {
      const side = metric.lado?.toLowerCase().trim();
      return group.key === "sin-lado" ? side !== "derecho" && side !== "izquierdo" : side === group.key;
    }).sort((a, b) => {
      const aTime = a.medido_en ? Date.parse(a.medido_en) : NaN;
      const bTime = b.medido_en ? Date.parse(b.medido_en) : NaN;
      return Number.isFinite(aTime) && Number.isFinite(bTime) ? aTime - bTime : 0;
    });
    return {
      ...group,
      metrics,
      data: metrics.map((metric, index) => ({
        registro: metric.medido_en && Number.isFinite(Date.parse(metric.medido_en))
          ? formatMetricTime(metric.medido_en)
          : `Registro ${index + 1}`,
        fecha: formatMetricTime(metric.medido_en),
        minimo: Number(metric.angulo_minimo),
        maximo: Number(metric.angulo_maximo),
      })),
    };
  }).filter(group => group.metrics.length > 0);
  const selectedSideGroup = sideGroups.find(group => group.key === activeSide) ?? sideGroups[0];
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

      <nav aria-label="Secciones de la ficha clínica" role="tablist" className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card p-2 shadow-clinical sm:grid-cols-3 sm:gap-3 sm:p-3">
        {([
          { id: "anamnesis", label: "Anamnesis y diagnóstico", detail: "Síntomas, exámenes y triaje", Icon: ClipboardList },
          { id: "evaluacion", label: "Evaluación y movilidad", detail: "Rango de movimiento", Icon: Activity },
          { id: "ejercicios", label: "Ejercicios", detail: "Asignación y seguimiento", Icon: Dumbbell },
        ] as const).map(({ id: tabId, label, detail, Icon }) => (
          <button
            key={tabId}
            type="button"
            id={`ficha-tab-${tabId}`}
            role="tab"
            aria-controls={`ficha-panel-${tabId}`}
            aria-selected={activeTab === tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-24 ${activeTab === tabId
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block break-words text-sm font-semibold leading-5">{label}</span>
              <span className={`mt-1 block break-words text-xs ${activeTab === tabId ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{detail}</span>
            </span>
          </button>
        ))}
      </nav>

      {activeTab === "anamnesis" && (
        <div id="ficha-panel-anamnesis" role="tabpanel" aria-labelledby="ficha-tab-anamnesis" className="min-w-0 space-y-5">
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
                {recentDocuments.map((doc, index) => (
                  <div key={`${doc.id}-${index}`} className="flex items-start gap-2 rounded-md border border-border p-3">
                    <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0"><p className="break-all font-medium">{doc.nombre_archivo}</p><p className="text-xs text-muted-foreground">{formatRecordDate(doc.subido_en) ?? "Fecha no disponible"}</p><PatientDocumentOpenButton patientId={id} documentId={doc.id} filename={doc.nombre_archivo} /></div>
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
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">Has descartado el texto sugerido para esta revisión. Puedes redactar un resumen alternativo; por ahora se conserva solo mientras permanezcas en esta ficha.</p>
                <label htmlFor="summary-manual" className="block text-sm font-medium">Resumen clínico alternativo (opcional)</label>
                <textarea id="summary-manual" className="w-full rounded-md border border-border bg-background p-3 text-sm" rows={5} placeholder="Redactar resumen clínico" value={manualSummary} onChange={(e)=>setManualSummary(e.target.value)} />
                {isDoctor && <Button variant="secondary" size="sm" onClick={() => { setSummaryDecision(null); setSummaryNotice(null); }}>Volver al resumen generado por IA</Button>}
                <p className="text-xs text-muted-foreground">Este resumen alternativo no se guarda en el servidor. No afecta el diagnóstico que elijas más abajo.</p>
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{summary?.resumen_generado || "No hay resumen clínico disponible."}</p>
            )}
            {summaryDecision === "accepted" && <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{summaryNotice || "Resumen revisado en esta sesión."}</p>}
            {isDoctor && summary && summaryDecision === null && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={reviewing} onClick={()=>setConfirmation("accept-summary")}><Check className="mr-1 size-4"/>Aceptar resumen</Button>
                <Button disabled={reviewing} variant="secondary" onClick={()=>setConfirmation("reject-summary")}><X className="mr-1 size-4"/>Rechazar resumen</Button>
              </div>
            )}
            {summaryError && <p role="alert" className="mt-3 text-sm text-destructive">{summaryError}</p>}
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Info className="size-4 shrink-0"/>La decisión sobre el resumen es independiente de la elección del diagnóstico clínico.</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold">Diagnósticos diferenciales sugeridos</h3>
            <p className="mt-1 text-xs text-muted-foreground">Son hipótesis generadas por IA, no diagnósticos confirmados.</p>
            <div role="radiogroup" aria-label="Diagnósticos diferenciales sugeridos" className="mt-3 space-y-2">
              {diagnosisOptions.length ? diagnosisOptions.map((item,index) => (
                <button
                  key={`${item.name}-${index}`}
                  type="button"
                  role="radio"
                  aria-checked={diagnosisMode === "suggested" && chosenDiagnosis === item.name}
                  aria-label={`${item.name}${item.estimate !== undefined ? `, estimación IA ${item.estimate}%` : ""}`}
                  onClick={() => {
                    setChosenDiagnosis(current => diagnosisMode === "suggested" && current === item.name ? "" : item.name);
                    setDiagnosisMode("suggested");
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground">
                    {diagnosisMode === "suggested" && chosenDiagnosis === item.name && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                  <span>{item.name}{item.estimate !== undefined ? ` · estimación IA ${item.estimate}%` : ""}</span>
                </button>
              )) : <p className="text-sm text-muted-foreground">No hay diagnósticos diferenciales disponibles.</p>}
            </div>
            {summary?.estado_revision === "confirmado" && <p role="status" className="mt-3 text-xs text-muted-foreground">Decisión médica registrada{summary.confirmado_por_nombre ? ` por ${summary.confirmado_por_nombre}` : ""}{summary.confirmado_en ? ` el ${formatMetricTime(summary.confirmado_en)}` : ""}.</p>}
            {diagnosisError && <p role="alert" className="mt-3 text-sm text-destructive">{diagnosisError}</p>}
            {isDoctor && diagnosisMode === "suggested" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={!chosenDiagnosis} onClick={() => setConfirmation("accept-diagnosis")}>Aceptar diagnóstico seleccionado</Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmation("reject-diagnosis")}>Ninguna sugerencia coincide: escribir diagnóstico propio</Button>
              </div>
            )}
            {diagnosisMode === "manual" ? (
              <div className="mt-4">
                <label htmlFor="diagnosis-manual" className="block text-sm font-medium">Diagnóstico clínico manual</label>
                <p className="mt-1 text-xs text-muted-foreground">Escribe tu propio diagnóstico si ninguna sugerencia corresponde. Esta elección se guarda de forma independiente del resumen clínico.</p>
                <textarea id="diagnosis-manual" rows={2} value={diagnosisDraft} onChange={(e) => setDiagnosisDraft(e.target.value)} placeholder="Escribe el diagnóstico del profesional (opcional)" className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={reviewing || !diagnosisDraft.trim()} onClick={() => void saveDiagnosis({ diagnostico_manual: diagnosisDraft.trim() })}>Guardar diagnóstico manual</Button>
                  <Button variant="secondary" size="sm" onClick={() => { setDiagnosisMode("suggested"); setDiagnosisDraft(""); }}>Volver a sugerencias de IA</Button>
                </div>
              </div>
            ) : acceptedDiagnosis ? (
              <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
                <strong>Diagnóstico seleccionado:</strong> {acceptedDiagnosis}
                <p className="mt-1 text-xs">{summary?.diagnostico_seleccionado === acceptedDiagnosis ? "Diagnóstico confirmado y guardado." : "Confirma la elección para guardarla."}</p>
              </div>
            ) : null}
          </div>
        </div>
      </Section>
        </div>
      )}

      {activeTab === "evaluacion" && (
        <div id="ficha-panel-evaluacion" role="tabpanel" aria-labelledby="ficha-tab-evaluacion" className="min-w-0 space-y-5">
      <Section title="Rango de movimiento" description="Evolución de las mediciones por articulación y extremidad">
        <div className="mt-4 space-y-4">
          {metricJointNames.length ? (
            <>
              <div role="tablist" aria-label="Articulaciones" className="flex flex-wrap gap-2">
                {metricJointNames.map(name => (
                  <button key={name} type="button" role="tab" aria-selected={joint === name}
                    onClick={() => setActiveJoint(name)}
                    className={`rounded-md border px-3 py-2 text-sm ${joint === name ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border"}`}>
                    {name}
                  </button>
                ))}
              </div>
              {sideGroups.length > 0 && (
                <>
                  {sideGroups.length > 1 && <div role="tablist" aria-label={`Extremidad de ${joint}`} className="flex flex-wrap gap-2">
                    {sideGroups.map(group => (
                      <button
                        key={`${joint}-${group.key}`}
                        type="button"
                        role="tab"
                        aria-selected={selectedSideGroup?.key === group.key}
                        onClick={() => setActiveSide(group.key)}
                        className={`rounded-md border px-3 py-2 text-sm ${selectedSideGroup?.key === group.key ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border"}`}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>}
                  {selectedSideGroup && (
                    <div key={`${joint}-${selectedSideGroup.key}`} role="tabpanel" className="min-w-0 rounded-md border border-border p-3 sm:p-4">
                      <h3 className="text-base font-semibold">{joint} · {selectedSideGroup.label}</h3>
                      <div className="mt-4 h-72 w-full min-w-0 sm:h-80 lg:h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedSideGroup.data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="registro" tick={{fontSize: 11}} minTickGap={16}/>
                            <YAxis unit="°" width={45}/>
                            <Tooltip labelFormatter={(label, payload) => payload?.[0]?.payload?.fecha ? String(payload[0].payload.fecha) : String(label)} />
                            <Legend/>
                            <Line type="linear" dataKey="minimo" name="Mínimo" stroke="#0d9488" strokeWidth={2} dot={{r: 5}} activeDot={{r: 7}} isAnimationActive={false}/>
                            <Line type="linear" dataKey="maximo" name="Máximo" stroke="#2563eb" strokeWidth={2} dot={{r: 5}} activeDot={{r: 7}} isAnimationActive={false}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[380px] text-left text-sm">
                          <thead><tr className="border-b border-border"><th className="py-2">Registro</th><th>Fecha y hora</th><th>Ángulo mínimo</th><th>Ángulo máximo</th></tr></thead>
                          <tbody>{selectedSideGroup.metrics.map((metric, index) => (
                            <tr key={index} className="border-b border-border">
                              <td className="py-2">{index + 1}</td><td className="pr-4">{formatMetricTime(metric.medido_en)}</td>
                              <td>{metric.angulo_minimo}°</td><td>{metric.angulo_maximo}°</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : <p className="text-sm text-muted-foreground">No hay mediciones registradas.</p>}
        </div>
      </Section>
        </div>
      )}

      {activeTab === "ejercicios" && (
        <div id="ficha-panel-ejercicios" role="tabpanel" aria-labelledby="ficha-tab-ejercicios" className="min-w-0 space-y-5">
      <Section title="Ejercicios de rehabilitación" description="Selección clínica desde la biblioteca de ejercicios">
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Cita a la que se asignarán los ejercicios</label>
            <select aria-label="Cita para asignar ejercicios" value={selectedAppointmentId}
              onChange={e => { if (!assignmentsDirty || window.confirm("Hay cambios sin guardar. ¿Cambiar de cita y descartarlos?")) setSelectedAppointmentId(e.target.value); }}
              className="w-full max-w-xl rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">Seleccionar cita...</option>
              {patientAppointments.map((c, index) => <option key={`${c.id}-${index}`} value={c.id}>#{c.id} · {appointmentDate(c.fecha_hora)} · {c.especialidad_nombre}</option>)}
            </select>
          </div>
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
          <p className="text-xs text-muted-foreground">Selecciona una articulación para consultar sus ejercicios.</p>
          {exercisesLoading && <p className="text-sm text-muted-foreground">Cargando ejercicios...</p>}
          {exercisesError && <p role="alert" className="text-sm text-destructive">{exercisesError}</p>}
          {!exerciseRegion && !exercisesLoading && !exercisesError && <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Selecciona una articulación para mostrar ejercicios disponibles.</p>}
          {Boolean(exerciseRegion) && !exercisesLoading && !exercisesError && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleExercises.map((exercise, exerciseIndex)=>{
              const selected = selectedExercises.includes(exercise.id);
              return <div key={`${exercise.id}-${exerciseIndex}`} className="flex flex-col rounded-md border border-border p-3 text-sm">
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
                <Button className="mt-3" size="sm" variant={selected ? "secondary" : "primary"} disabled={!selectedAppointmentId || assignmentsLoading || assignmentsSaving} onClick={()=>{setAssignmentsDirty(true);setAssignmentNotice(null);setSelectedExercises(prev=>selected ? prev.filter(x=>x!==exercise.id) : [...prev,exercise.id]);}}>{selected ? <><X className="mr-1 size-3"/>Quitar de la lista</> : <><Plus className="mr-1 size-3"/>Agregar a la lista</>}</Button>
              </div>;
            })}
            {!visibleExercises.length && <p className="text-sm text-muted-foreground">No hay ejercicios en esta categoría.</p>}
          </div>}
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <h3 className="font-semibold">Lista de ejercicios seleccionados ({selectedExercises.length})</h3>
            {selectedExercises.length ? <ul className="mt-3 space-y-2">{selectedExercises.map((exerciseId, index)=>{ const ex=exercises.find(e=>e.id===exerciseId);return ex ? <li key={`${exerciseId}-${index}`} className="flex items-center justify-between gap-2 text-sm"><span>{ex.nombre_ejercicio} · {ex.articulacion}</span><button type="button" className="text-primary hover:underline" disabled={assignmentsSaving} onClick={()=>{setAssignmentsDirty(true);setSelectedExercises(prev=>prev.filter(x=>x!==exerciseId));}}>Quitar</button></li> : null; })}</ul> : <p className="mt-2 text-sm text-muted-foreground">Todavía no has agregado ejercicios.</p>}
            {assignmentsLoading && <p className="mt-3 text-sm text-muted-foreground">Cargando ejercicios asignados...</p>}
            {assignmentError && <p role="alert" className="mt-3 text-sm text-destructive">{assignmentError}</p>}
            {assignmentNotice && <p role="status" className="mt-3 text-sm text-emerald-700">{assignmentNotice}</p>}
            {selectedAppointmentId ? <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button disabled={assignmentsLoading || assignmentsSaving || !assignmentsDirty || selectedExercises.length > 20} onClick={() => void saveExerciseAssignment()}>{assignmentsSaving ? "Guardando..." : "Guardar ejercicios asignados"}</Button>
              {assignmentsDirty && <span className="text-xs text-amber-700">Cambios sin guardar</span>}
              {selectedExercises.length > 20 && <span className="text-xs text-destructive">Máximo 20 ejercicios por cita.</span>}
            </div> : <p className="mt-3 text-xs text-muted-foreground">Selecciona una cita para guardar una prescripción de ejercicios.</p>}
          </div>
          {selectedAppointmentId && <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold">Historial de ejercicios realizados en la cita</h3>
            {!exerciseExecutions.length ? <p className="mt-2 text-sm text-muted-foreground">No hay ejecuciones registradas para esta cita.</p> :
              <ul className="mt-3 space-y-2">{exerciseExecutions.map((entry, index) => <li key={`${entry.id}-${index}`} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium">{entry.nombre_ejercicio || exercises.find(ex => ex.id === entry.ejercicio_id)?.nombre_ejercicio || `Ejercicio #${entry.ejercicio_id}`}</p>
                <p className="text-xs text-muted-foreground">{new Date(entry.ejecutado_en).toLocaleString("es-CL")} · {entry.correcto ? "Correcto" : "Con dificultad"}</p>
                {entry.comentario && <p className="mt-1 whitespace-pre-wrap">{entry.comentario}</p>}
              </li>)}</ul>}
          </div>}
        </div>
      </Section>
        </div>
      )}

      {confirmation && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
        <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
          <h2 id="confirm-title" className="text-lg font-semibold">Confirmar decisión</h2>
          <p className="mt-3 text-sm">{confirmation==="accept-summary" ? "¿Deseas aceptar este resumen y registrar su revisión médica?" : confirmation==="reject-summary" ? "¿Deseas rechazar el resumen de IA? Podrás escribir otro o dejarlo en blanco durante esta sesión." : confirmation === "reject-diagnosis" ? "¿Deseas escribir un diagnóstico clínico propio en lugar de utilizar las sugerencias de IA?" : `¿Deseas confirmar y guardar «${chosenDiagnosis}» como diagnóstico clínico?`}</p>
          <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setConfirmation(null)}>Cancelar</Button><Button disabled={reviewing} onClick={()=>void confirmAction()}>Confirmar</Button></div>
        </div>
      </div>}
    </div>
  );
}
