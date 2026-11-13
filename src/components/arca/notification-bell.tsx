import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarClock, ClipboardList, FileText, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigate } from "@/lib/router";
import { listAppointments, type Appointment } from "@/services/appointments";
import { getTriagePatients } from "@/services/triage";
import { getPatientDocuments } from "@/services/patient-detail";
import type { UserProfile } from "@/services/profile";

type NoticeKind = "appointment" | "triage" | "document";
type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  detail: string;
  destination: string;
  timestamp: number;
};

const DAY = 86_400_000;
const pad = (value: number) => String(value).padStart(2, "0");
const localDay = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
const timeLabel = (date: Date) =>
  new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);

// Guarda únicamente identificadores de avisos leídos, no información clínica.
function storageKey(userId: number) {
  return `arca-med-notifications-read-v1-${userId}`;
}
function getReadIds(userId: number): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string").slice(-500) : [];
  } catch {
    return [];
  }
}
function persistReadIds(userId: number, ids: string[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(ids.slice(-500)));
  } catch {
    // El almacenamiento local puede estar bloqueado; las notificaciones siguen disponibles.
  }
}

function appointmentNotices(appointments: Appointment[], now: Date): Notice[] {
  const notices: Notice[] = [];
  const today = localDay(now);
  for (const appointment of appointments) {
    if (appointment.estado !== "programada") continue;
    const when = new Date(appointment.fecha_hora);
    if (!Number.isFinite(when.getTime())) continue;
    if (localDay(when) === today) {
      notices.push({
        id: `today:${today}:${appointment.id}`,
        kind: "appointment",
        title: "Cita agendada para hoy",
        detail: `${appointment.paciente_nombre} · ${timeLabel(when)}`,
        destination: "/agenda",
        timestamp: when.getTime(),
      });
    } else if (when.getTime() > now.getTime() && when.getTime() <= now.getTime() + DAY) {
      notices.push({
        id: `upcoming:${appointment.id}:${when.toISOString()}`,
        kind: "appointment",
        title: "Próxima cita médica",
        detail: `${appointment.paciente_nombre} · ${dateLabel(when)}`,
        destination: "/agenda",
        timestamp: when.getTime(),
      });
    }
  }
  return notices;
}

export function NotificationBell({ profile }: { profile: UserProfile | null }) {
  const isDoctor = profile?.rol === "medico";
  const userId = isDoctor ? profile.id : null;
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    setRead(userId === null ? [] : getReadIds(userId));
    setNotices([]);
    setError(null);
    setOpen(false);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!isDoctor || userId === null) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + DAY * 3);
    try {
      const [appointmentsResult, triageResult] = await Promise.allSettled([
        listAppointments({ desde: start.toISOString(), hasta: end.toISOString() }),
        getTriagePatients(),
      ]);
      if (currentRequest !== requestId.current) return;
      const next: Notice[] = [];
      const failures: string[] = [];
      let appointments: Appointment[] = [];
      if (appointmentsResult.status === "fulfilled") {
        appointments = appointmentsResult.value;
        next.push(...appointmentNotices(appointments, now));
      } else failures.push("citas");
      if (triageResult.status === "fulfilled") {
        for (const patient of triageResult.value) {
          const priority = patient.urgencia_sugerida.trim().toLowerCase();
          next.push({
            id: `triage:${patient.usuario_id}:${priority}`,
            kind: "triage",
            title: priority === "alta" || priority === "high" ? "Triaje de prioridad alta" : "Paciente con triaje",
            detail: `${patient.nombre} · Prioridad ${patient.urgencia_sugerida}`,
            destination: `/patients/${patient.usuario_id}`,
            timestamp: now.getTime(),
          });
        }
      } else failures.push("triaje");

      // No hay endpoint de documentos global: se revisan solamente pacientes
      // con cita cercana. Límite de consultas para evitar sobrecargar el servidor.
      const patientIds = [...new Set(appointments.filter(a => a.estado === "programada")
        .map(a => a.paciente_id))].slice(0, 10);
      if (patientIds.length) {
        const documentResults = await Promise.allSettled(patientIds.map(id => getPatientDocuments(id)));
        if (currentRequest !== requestId.current) return;
        documentResults.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const id = patientIds[index];
          const patientName = appointments.find(a => a.paciente_id === id)?.paciente_nombre ?? `Paciente #${id}`;
          for (const doc of result.value) {
            const uploaded = new Date(doc.subido_en);
            if (!Number.isFinite(uploaded.getTime()) || uploaded.getTime() < now.getTime() - DAY || uploaded.getTime() > now.getTime() + 60_000) continue;
            next.push({
              id: `document:${id}:${doc.id}`,
              kind: "document",
              title: "Documento reciente del paciente",
              detail: `${patientName} · ${doc.nombre_archivo}`,
              destination: `/patients/${id}`,
              timestamp: uploaded.getTime(),
            });
          }
        });
      }
      next.sort((a, b) => b.timestamp - a.timestamp);
      setNotices(next);
      if (failures.length) setError(`No fue posible consultar: ${failures.join(" y ")}.`);
    } catch {
      if (currentRequest === requestId.current) setError("No fue posible actualizar las notificaciones.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [isDoctor, userId]);

  useEffect(() => {
    if (!isDoctor) return;
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 300_000);
    function onFocus() { void refresh(); }
    window.addEventListener("focus", onFocus);
    return () => {
      ++requestId.current;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [isDoctor, refresh]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const unread = useMemo(() => notices.filter(n => !read.includes(n.id)).length, [notices, read]);
  function markRead(ids: string[]) {
    if (userId === null) return;
    setRead(previous => {
      const updated = [...new Set([...previous, ...ids])].slice(-500);
      persistReadIds(userId, updated);
      return updated;
    });
  }
  const iconFor = (kind: NoticeKind) => kind === "appointment" ? CalendarClock : kind === "triage" ? ClipboardList : FileText;

  return (
    <div className="relative" ref={container}>
      <Button
        variant="secondary"
        size="icon"
        className="relative"
        aria-label={unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => { setOpen(value => !value); if (!open) void refresh(); }}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div role="dialog" aria-label="Notificaciones" className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,380px)] overflow-hidden rounded-lg border border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-semibold">Notificaciones</p>
              <p className="text-xs text-muted-foreground">{unread} sin leer</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label="Actualizar notificaciones" title="Actualizar" onClick={() => void refresh()} disabled={loading}>
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Cerrar notificaciones" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>
          {!isDoctor ? (
            <p className="p-4 text-sm text-muted-foreground">Los avisos automáticos están disponibles por ahora para médicos.</p>
          ) : (
            <>
              {error && <p role="status" className="border-b border-border px-4 py-2 text-xs text-destructive">{error}</p>}
              <div className="max-h-[min(60vh,420px)] overflow-y-auto">
                {notices.length === 0 ? (
                  <p className="p-5 text-center text-sm text-muted-foreground">{loading ? "Consultando avisos..." : error ? "No hay avisos disponibles con los datos consultados." : "No hay notificaciones por el momento."}</p>
                ) : notices.map(notice => {
                  const Icon = iconFor(notice.kind);
                  const isUnread = !read.includes(notice.id);
                  return (
                    <button key={notice.id} type="button" onClick={() => {
                      markRead([notice.id]); setOpen(false); void navigate({ to: notice.destination });
                    }} className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted last:border-0">
                      <Icon className="mt-1 size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>{notice.title}</span>
                        <span className="mt-0.5 block break-words text-xs text-muted-foreground">{notice.detail}</span>
                      </span>
                      {isUnread && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Sin leer" />}
                    </button>
                  );
                })}
              </div>
              {unread > 0 && (
                <div className="border-t border-border px-4 py-2 text-right">
                  <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => markRead(notices.map(n => n.id))}>Marcar todas como leídas</button>
                </div>
              )}
              <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Se actualizan mientras el portal está abierto. Documentos: solo pacientes con citas cercanas (hasta 10).</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
