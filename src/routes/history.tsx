import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@/lib/router";
import { CalendarDays, ClipboardList, FileText, History, RefreshCw } from "lucide-react";
import { Section } from "@/components/arca/clinical";
import { Button } from "@/components/ui/button";
import { listAppointments, type Appointment } from "@/services/appointments";
import { getMedicalPatients, type RegisteredPatient } from "@/services/patients";
import {
  getPatientDocuments,
  getPatientSymptoms,
  type PatientDocument,
  type PatientSymptom,
} from "@/services/patient-detail";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Historial clínico — ARCA Med" }] }),
  component: HistoryPage,
});

type TimelineEvent = {
  key: string;
  time: number;
  dateLabel: string;
  title: string;
  description: string;
  patientId: number;
  patientName: string;
  kind: "cita" | "sintoma" | "documento";
};

function formattedDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Fecha no disponible"
    : parsed.toLocaleString("es-CL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      });
}

function dateOrder(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : -Infinity;
}

function HistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<RegisteredPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicalLoading, setClinicalLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [symptomsError, setSymptomsError] = useState<string | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAppointmentError(null);
    setPatientsError(null);
    Promise.allSettled([listAppointments(), getMedicalPatients()]).then(([citas, pacientes]) => {
      if (!active) return;
      if (citas.status === "fulfilled") setAppointments(citas.value);
      else { setAppointments([]); setAppointmentError("No se pudieron consultar las citas del médico."); }
      if (pacientes.status === "fulfilled") setPatients(pacientes.value);
      else { setPatients([]); setPatientsError("No se pudo cargar el directorio de pacientes."); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    setSymptoms([]);
    setDocuments([]);
    setSymptomsError(null);
    setDocumentsError(null);
    if (!selectedPatientId) {
      setClinicalLoading(false);
      return () => { active = false; };
    }
    const id = Number(selectedPatientId);
    if (!Number.isSafeInteger(id) || id <= 0) return () => { active = false; };
    setClinicalLoading(true);
    Promise.allSettled([getPatientSymptoms(id), getPatientDocuments(id)]).then(([s, d]) => {
      if (!active) return;
      if (s.status === "fulfilled") setSymptoms(s.value);
      else setSymptomsError("No se pudo consultar el historial de síntomas de este paciente.");
      if (d.status === "fulfilled") setDocuments(d.value);
      else setDocumentsError("No se pudo consultar el historial de exámenes de este paciente.");
    }).finally(() => { if (active) setClinicalLoading(false); });
    return () => { active = false; };
  }, [selectedPatientId, refreshKey]);

  const selectedPatient = patients.find((p) => String(p.id) === selectedPatientId);

  const events = useMemo(() => {
    const items: TimelineEvent[] = [];
    for (const cita of appointments) {
      if (selectedPatientId && String(cita.paciente_id) !== selectedPatientId) continue;
      items.push({
        key: `cita-${cita.id}`, kind: "cita", patientId: cita.paciente_id,
        patientName: cita.paciente_nombre,
        time: dateOrder(cita.fecha_hora), dateLabel: `Fecha de atención: ${formattedDate(cita.fecha_hora)}`,
        title: `Cita ${cita.estado}`,
        description: `${cita.duracion_minutos} minutos${cita.motivo ? ` · ${cita.motivo}` : ""}`,
      });
    }
    if (selectedPatient) {
      for (const sintoma of symptoms) {
        items.push({
          key: `sintoma-${sintoma.id}`, kind: "sintoma", patientId: selectedPatient.id,
          patientName: selectedPatient.nombre, time: dateOrder(sintoma.creado_en),
          dateLabel: `Registrado: ${formattedDate(sintoma.creado_en)}`,
          title: "Síntoma registrado", description: sintoma.descripcion,
        });
      }
      for (const documento of documents) {
        items.push({
          key: `documento-${documento.id}`, kind: "documento", patientId: selectedPatient.id,
          patientName: selectedPatient.nombre, time: dateOrder(documento.subido_en),
          dateLabel: `Subido: ${formattedDate(documento.subido_en)}`,
          title: "Examen registrado", description: documento.nombre_archivo,
        });
      }
    }
    return items.sort((a, b) => b.time - a.time);
  }, [appointments, selectedPatient, selectedPatientId, symptoms, documents]);

  const hasError = Boolean(appointmentError || patientsError || symptomsError || documentsError);
  const isLoading = loading || clinicalLoading;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Actividad clínica</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Historial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Citas reales del médico y registros clínicos del paciente seleccionado.
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={reload} disabled={isLoading}>
          <RefreshCw className="mr-2 size-4" />Actualizar
        </Button>
      </header>
      <Section title="Historial médico y de pacientes" description="Datos obtenidos de las citas, síntomas y exámenes registrados en ARCA Med.">
        <div className="mt-4 space-y-2">
          <label htmlFor="history-patient" className="block text-sm font-medium">Paciente</label>
          <select
            id="history-patient"
            value={selectedPatientId}
            onChange={(event) => setSelectedPatientId(event.target.value)}
            className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas mis citas (sin registros clínicos por paciente)</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.nombre}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Selecciona un paciente para consultar también sus síntomas y exámenes. Las citas visibles
            corresponden a la cuenta médica autenticada.
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {[appointmentError, patientsError, symptomsError, documentsError].filter(Boolean).map((error) => (
            <p key={error} role="alert" className="text-sm text-destructive">{error}</p>
          ))}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando historial...</p>
          ) : events.length === 0 && !hasError ? (
            <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
              No hay registros disponibles para esta selección.
            </p>
          ) : events.length === 0 ? null : (
            <div className="space-y-2">
              {events.map((event) => {
                const Icon = event.kind === "cita" ? CalendarDays : event.kind === "sintoma" ? ClipboardList : FileText;
                return (
                  <article key={event.key} className="flex items-start gap-3 rounded-md border border-border p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.patientName}</p>
                      <p className="whitespace-pre-wrap break-words text-sm">{event.description}</p>
                      <time className="block text-xs text-muted-foreground">{event.dateLabel}</time>
                      <Link to={`/patients/${event.patientId}`} className="inline-block pt-1 text-xs font-semibold text-primary hover:underline">
                        Ver ficha del paciente
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </Section>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <History className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Este historial muestra citas según su fecha de atención y registros clínicos según su fecha
        de creación. No identifica cuándo se editó o quién modificó cada registro; esos datos
        requieren un historial de cambios provisto por el backend.
      </p>
    </div>
  );
}
