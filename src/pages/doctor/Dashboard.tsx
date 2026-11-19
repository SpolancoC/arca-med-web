import { formatDisplayDate, useDateStyle } from "@/lib/display-preferences";
import { Link, createFileRoute } from "@/lib/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getProfile, type UserProfile } from "@/services/profile";
import { getTriagePatients, type TriagePatient } from "@/services/triage";
import { listAppointments, isSameLocalDay, appointmentDate, type Appointment } from "@/services/appointments";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  ArrowRight,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, StatCard, TriageBadge } from "@/components/arca/clinical";
import type { Priority } from "@/lib/arca-data";
import { CreateAppointmentDialog } from "@/components/arca/create-appointment-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel clínico — ARCA Med" },
      {
        name: "description",
        content:
          "Panel clínico del médico con triaje real y estado de las integraciones pendientes.",
      },
    ],
  }),
  component: Dashboard,
});

const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey(): string {
  const today = new Date();
  return dateKey(today.getFullYear(), today.getMonth(), today.getDate());
}

function formatSelectedDate(key: string): string {
  const [year,month,day] = key.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("es-CL", { weekday: "long" }).format(new Date(year,month-1,day));
  return `${weekday} ${formatDisplayDate(key)}`;
}

function DailyCalendar() {
  useDateStyle();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [refreshAgenda, setRefreshAgenda] = useState(0);
  const [showCreateAppointment, setShowCreateAppointment] = useState(false);
  useEffect(() => {
    let active = true;
    setAgendaLoading(true);
    setAgendaError(null);
    void listAppointments().then(items => {
      if (active) {setAppointments(items);setAgendaLoading(false);}
    }, error => {
      if (active) {setAgendaError(error instanceof Error ? error.message : "No se pudo consultar la agenda.");setAgendaLoading(false);}
    });
    return () => {active=false;};
  }, [refreshAgenda]);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const dayAppointments = appointments.filter(item=>isSameLocalDay(item.fecha_hora,selectedDate));


  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(dateKey(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <>
    <Section
      title="Agenda de pacientes"
      description="Citas reales de tu agenda médica"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateAppointment(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Nueva cita
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/agenda">Ver mi agenda</Link>
          </Button>
        </div>
      }
    >
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]">
        <div className="rounded-lg border border-border bg-surface-raised/55 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => changeMonth(-1)}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-semibold capitalize">
                {monthNames[month]} {year}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Selecciona un día
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => changeMonth(1)}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-2 text-[11px] font-semibold text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {cells.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const key = dateKey(year, month, day);
              const selected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`relative grid aspect-square min-h-10 place-items-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  aria-label={`Seleccionar ${day} de ${monthNames[month]}`}
                  aria-pressed={selected}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <CalendarDays className="size-4 text-primary" />
            <div>
              <p className="text-sm font-semibold capitalize">
                {formatSelectedDate(selectedDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                {agendaLoading ? "Cargando citas..." : agendaError ? "No se pudo consultar la agenda" : `${dayAppointments.length} cita(s) registradas`}
              </p>
            </div>
          </div>
          <div className="mt-4 min-h-48 space-y-3">
            {agendaLoading ? <p className="text-sm text-muted-foreground">Cargando citas...</p> : agendaError ? <div role="alert" className="rounded-md border border-border p-4"><p className="text-sm text-destructive">{agendaError}</p><Button className="mt-3" variant="secondary" size="sm" onClick={()=>setRefreshAgenda(n=>n+1)}>Reintentar</Button></div> : dayAppointments.length === 0 ? <div className="rounded-lg border border-dashed border-border p-6 text-center"><CalendarDays className="mx-auto size-7 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">No hay citas registradas para este día.</p></div> : dayAppointments.map(item=><div key={item.id} className="rounded-md border border-border bg-surface-raised p-3"><p className="text-sm font-semibold">{item.paciente_nombre}</p><p className="mt-1 text-xs text-muted-foreground">{appointmentDate(item.fecha_hora)} · {item.duracion_minutos} minutos · {item.estado}</p>{item.motivo&&<p className="mt-2 text-xs">{item.motivo}</p>}<Link to={`/patients/${item.paciente_id}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Ver ficha</Link></div>)}
          </div>
        </div>
      </div>
    </Section>
    <CreateAppointmentDialog
      open={showCreateAppointment}
      onClose={() => setShowCreateAppointment(false)}
      initialDate={selectedDate}
      onCreated={() => setRefreshAgenda((value) => value + 1)}
    />
    </>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

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

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

const priorityOrder: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

/** El endpoint puede devolver varios prediagnósticos pendientes por paciente. */
function uniquePendingPatients(items: TriagePatient[]): TriagePatient[] {
  const unique = new Map<number, TriagePatient>();
  for (const item of items) {
    const existing = unique.get(item.usuario_id);
    const incomingRank = getPriority(item.urgencia_sugerida);
    const existingRank = existing && getPriority(existing.urgencia_sugerida);
    if (
      !existing ||
      (incomingRank ? priorityOrder[incomingRank] : 3) <
        (existingRank ? priorityOrder[existingRank] : 3)
    ) {
      unique.set(item.usuario_id, item);
    }
  }
  return [...unique.values()].sort((a, b) => {
    const ap = getPriority(a.urgencia_sugerida);
    const bp = getPriority(b.urgencia_sugerida);
    return (ap ? priorityOrder[ap] : 3) - (bp ? priorityOrder[bp] : 3);
  });
}

function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pendingTriage, setPendingTriage] = useState<TriagePatient[]>([]);
  const [loadingTriage, setLoadingTriage] = useState(true);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [onlyHighPriority, setOnlyHighPriority] = useState(false);

  const refresh = useCallback(
    () => setRefreshVersion((version) => version + 1),
    [],
  );

  useEffect(() => {
    let active = true;
    void getProfile().then(
      (user) => {
        if (active) setProfile(user);
      },
      () => {
        if (active) setProfile(null);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingTriage(true);
    setTriageError(null);

    void getTriagePatients().then(
      (items) => {
        if (active) {
          setPendingTriage(items);
          setLoadingTriage(false);
        }
      },
      (error: unknown) => {
        if (active) {
          setLoadingTriage(false);
          setTriageError(
            error instanceof Error
              ? error.message
              : "No se pudo consultar el triaje.",
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, [refreshVersion]);

  // Refrescar al regresar a la pestaña después de revisar a un paciente.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const pendingPatients = useMemo(
    () => uniquePendingPatients(pendingTriage),
    [pendingTriage],
  );
  const highPriority = pendingPatients.filter(
    (p) => getPriority(p.urgencia_sugerida) === "High",
  ).length;
  const visiblePendingPatients = onlyHighPriority
    ? pendingPatients.filter((patient) => getPriority(patient.urgencia_sugerida) === "High")
    : pendingPatients;
  const pendingCount =
    loadingTriage && pendingTriage.length === 0
      ? "…"
      : triageError
        ? "—"
        : String(pendingPatients.length);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-accent">
            Panel clínico
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            {getGreeting()}, {profile?.nombre ?? "Usuario"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Información de tu agenda médica y triaje; las evaluaciones requieren integración.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={refresh}
          disabled={loadingTriage}
        >
          <RefreshCw className="size-4" />{" "}
          {loadingTriage ? "Actualizando…" : "Actualizar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatCard
          label="Evaluaciones de hoy"
          value="—"
          detail="No hay evaluaciones hoy"
          icon={ClipboardCheck}
        />
        <StatCard
          label="Pacientes que requieren atención"
          value={pendingCount}
          detail={
            triageError
              ? "No fue posible consultar triaje"
              : `Triaje pendiente · ${highPriority} prioridad alta`
          }
          icon={Activity}
          tone="attention"
        />
        {/* PENDIENTE: Revisiones de ejercicios. Reactivar al integrar el servicio.
        <StatCard
          label="Revisiones de ejercicios pendientes"
          value="—"
          detail="Sin endpoint de revisiones"
          icon={Dumbbell}
          tone="accent"
        />
        */}
      </div>

      <Section title="Accesos rápidos" description="Herramientas disponibles para el trabajo clínico">
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { title: "Pacientes", description: "Consultar el directorio y abrir fichas clínicas.", href: "/patients", Icon: Users },
            { title: "Triaje", description: "Revisar los prediagnósticos pendientes.", href: "/triage", Icon: ClipboardCheck },
            { title: "Guías clínicas", description: "Consultar guías de apoyo a la atención.", href: "/guias-clinicas", Icon: BookMarked },
          ].map(({ title, description, href, Icon }) => (
            <Link key={href} to={href} className="group flex min-h-28 flex-col justify-between rounded-md border border-border bg-surface-raised/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Icon className="size-4 text-primary" /> {title}
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-xs text-muted-foreground">{description}</p>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {triageError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 p-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>
            No se pudo cargar el triaje: {triageError}. La cifra no está
            disponible.
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={refresh}>
            Reintentar
          </Button>
        </div>
      )}

      <DailyCalendar />

      <Section
        title="Pacientes que requieren atención"
        description="Pacientes únicos con prediagnóstico pendiente de revisión, ordenados por urgencia sugerida"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/triage">Ver triaje</Link>
          </Button>
        }
      >
        {!triageError && !loadingTriage && pendingPatients.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {onlyHighPriority
                ? `${visiblePendingPatients.length} de ${pendingPatients.length} pacientes con prioridad alta sugerida`
                : `${pendingPatients.length} pacientes pendientes · ${highPriority} con prioridad alta sugerida`}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pendientes por prioridad">
              <Button type="button" variant={onlyHighPriority ? "outline" : "secondary"} size="sm" aria-pressed={!onlyHighPriority} onClick={() => setOnlyHighPriority(false)}>
                Todos
              </Button>
              <Button type="button" variant={onlyHighPriority ? "secondary" : "outline"} size="sm" aria-pressed={onlyHighPriority} onClick={() => setOnlyHighPriority(true)}>
                Prioridad alta ({highPriority})
              </Button>
            </div>
          </div>
        )}
        {loadingTriage && pendingTriage.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Cargando pacientes desde el backend…
          </p>
        ) : triageError ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No se puede mostrar la lista en este momento.
          </p>
        ) : pendingPatients.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No hay pacientes con prediagnósticos pendientes de revisión.
          </p>
        ) : visiblePendingPatients.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No hay pacientes pendientes con prioridad alta sugerida. Puedes seleccionar «Todos» para ver el resto.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {visiblePendingPatients.slice(0, 5).map((patient) => {
              const priority = getPriority(patient.urgencia_sugerida);
              return (
                <div
                  key={patient.usuario_id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {getInitials(patient.nombre)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {patient.nombre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Paciente #{patient.usuario_id} · Triaje pendiente
                    </p>
                  </div>
                  {priority ? (
                    <TriageBadge priority={priority} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {patient.urgencia_sugerida || "Sin clasificar"}
                    </span>
                  )}
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="hidden sm:inline-flex"
                  >
                    <Link
                      to="/patients/$patientId"
                      params={{ patientId: String(patient.usuario_id) }}
                    >
                      Revisar
                    </Link>
                  </Button>
                </div>
              );
            })}
            {visiblePendingPatients.length > 5 && (
              <p className="py-3 text-xs text-muted-foreground">
                Mostrando 5 de {visiblePendingPatients.length} pacientes{onlyHighPriority ? " de prioridad alta sugerida" : ""}. Abre Triaje
                para revisar los demás.
              </p>
            )}
          </div>
        )}
      </Section>

      {/* PENDIENTE: Evaluaciones recientes. Reactivar con datos reales de evaluaciones móviles.
      <Section
        title="Evaluaciones recientes"
        description="Historial médico pendiente de endpoint"
      >
        <div className="mt-4 flex items-start gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            El backend no ofrece actualmente un listado de evaluaciones médicas.
            Los ejemplos locales fueron retirados del Dashboard para que no se
            confundan con evaluaciones reales.
          </p>
        </div>
      </Section>
      */}
    </div>
  );
}
