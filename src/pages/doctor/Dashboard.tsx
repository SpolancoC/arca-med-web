import { Link, createFileRoute } from "@/lib/router";
import { useEffect, useMemo, useState } from "react";
import { getProfile, type UserProfile } from "@/services/profile";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Dumbbell,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RowAction,
  Section,
  StatCard,
  TriageBadge,
} from "@/components/arca/clinical";
import { evaluations, patients, todayEvaluations } from "@/lib/arca-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel clínico — ARCA Med" },
      {
        name: "description",
        content:
          "Revisa prioridades, evaluaciones recientes y progreso del rango de movimiento.",
      },
      { property: "og:title", content: "Panel clínico — ARCA Med" },
      {
        property: "og:description",
        content:
          "Una visión clínica enfocada en la atención musculoesquelética.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
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

// Mock de agenda. Más adelante este arreglo puede venir desde FastAPI.
const scheduledEvaluations = [
  ...todayEvaluations.map((item) => ({ ...item, calendarDate: "2026-09-21" })),
  {
    ...todayEvaluations[0],
    id: "EV-AGENDA-1",
    patientId: "ARC-1048",
    calendarDate: "2026-10-05",
    date: "5 oct 2026",
    time: "08:30",
    type: "Control de seguimiento",
    status: "Programada",
  },
  {
    ...todayEvaluations[2],
    id: "EV-AGENDA-2",
    patientId: "ARC-0982",
    calendarDate: "2026-10-05",
    date: "5 oct 2026",
    time: "10:00",
    status: "Programada",
  },
  {
    ...todayEvaluations[3],
    id: "EV-AGENDA-3",
    patientId: "ARC-1091",
    calendarDate: "2026-10-05",
    date: "5 oct 2026",
    time: "11:30",
    status: "Programada",
  },
  {
    ...todayEvaluations[1],
    id: "EV-AGENDA-4",
    patientId: "ARC-1077",
    calendarDate: "2026-10-07",
    date: "7 oct 2026",
    time: "09:15",
    status: "Programada",
  },
  {
    ...todayEvaluations[0],
    id: "EV-AGENDA-5",
    patientId: "ARC-1124",
    calendarDate: "2026-10-08",
    date: "8 oct 2026",
    time: "12:00",
    joint: "Columna lumbar",
    type: "Evaluación de rango de movimiento",
    status: "Programada",
  },
  {
    ...todayEvaluations[2],
    id: "EV-AGENDA-6",
    patientId: "ARC-0982",
    calendarDate: "2026-10-12",
    date: "12 oct 2026",
    time: "15:20",
    type: "Control de seguimiento",
    status: "Programada",
  },
  {
    ...todayEvaluations[3],
    id: "EV-AGENDA-7",
    patientId: "ARC-1091",
    calendarDate: "2026-10-15",
    date: "15 oct 2026",
    time: "10:40",
    status: "Programada",
  },
];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatSelectedDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function DailyCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(2026, 9, 1));
  const [selectedDate, setSelectedDate] = useState("2026-10-05");

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const appointmentDates = useMemo(
    () => new Set(scheduledEvaluations.map((item) => item.calendarDate)),
    [],
  );

  const selectedAppointments = scheduledEvaluations
    .filter((item) => item.calendarDate === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(dateKey(next.getFullYear(), next.getMonth(), 1));
  };

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  return (
    <Section
      title="Agenda de pacientes"
      description="Selecciona un día para revisar los pacientes programados"
      action={
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/today">Ver agenda</Link>
        </Button>
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
                Los puntos indican días con pacientes
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
              const hasAppointments = appointmentDates.has(key);

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
                  {hasAppointments && (
                    <span
                      className={`absolute bottom-1 size-1.5 rounded-full ${
                        selected ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                  )}
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
                {selectedAppointments.length === 1
                  ? "1 paciente programado"
                  : `${selectedAppointments.length} pacientes programados`}
              </p>
            </div>
          </div>

          {selectedAppointments.length > 0 ? (
            <div className="divide-y divide-border">
              {selectedAppointments.map((appointment) => {
                const patient = patients.find(
                  (item) => item.id === appointment.patientId,
                );
                if (!patient) return null;

                return (
                  <div
                    key={appointment.id}
                    className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {appointment.time}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {patient.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {appointment.type} · {appointment.joint}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {appointment.status}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="col-start-2 justify-self-start sm:col-start-auto"
                    >
                      <Link
                        to="/patients/$patientId"
                        params={{ patientId: patient.id }}
                      >
                        Ver ficha
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-border p-6 text-center">
              <div>
                <CalendarDays className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">
                  Sin pacientes programados
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecciona otro día del calendario para revisar la agenda.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Buenos días";
  }

  if (hour >= 12 && hour < 20) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

function Index() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("No se pudo cargar el perfil:", error);
      }
    }

    void loadProfile();
  }, []);

  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-accent">Fecha</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            {greeting}, {profile?.nombre ?? "Usuario"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aquí tienes un resumen de tus pacientes y la actividad clínica
            reciente.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Pacientes activos"
          value="48"
          detail="3 añadidos esta semana"
          icon={Users}
        />
        <StatCard
          label="Evaluaciones de hoy"
          value="12"
          detail="2 completadas"
          icon={ClipboardCheck}
        />
        <StatCard
          label="Pacientes que requieren atención"
          value="7"
          detail="2 de prioridad alta"
          icon={Activity}
          tone="attention"
        />
        <StatCard
          label="Revisiones de ejercicios pendientes"
          value="9"
          detail="planes de ejercicios"
          icon={Dumbbell}
          tone="accent"
        />
      </div>
      <DailyCalendar />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Section
          title="Pacientes que requieren atención"
          description="Priorizados por triaje y actividad clínica reciente"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/patients">Ver todos</Link>
            </Button>
          }
        >
          <div className="mt-3 divide-y divide-border">
            {patients.slice(0, 4).map((patient) => (
              <div
                key={patient.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {patient.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {patient.name}, {patient.age}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {patient.condition} · {patient.rom} ·{" "}
                    {patient.lastEvaluation}
                  </p>
                </div>
                <TriageBadge priority={patient.priority} />
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link
                    to="/patients/$patientId"
                    params={{ patientId: patient.id }}
                  >
                    Revisar
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section
        title="Evaluaciones recientes"
        description="Últimas valoraciones clínicas de tus pacientes activos"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/evaluations">Abrir evaluaciones</Link>
          </Button>
        }
      >
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {evaluations.map((item) => (
            <article
              key={item.patient}
              className="rounded-md border border-border bg-surface-raised/55 p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{item.patient}</p>
                <TriageBadge priority={item.priority} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.date} · {item.region}
              </p>
              <p className="mt-3 text-xs font-medium">{item.rom}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {item.status}
                </span>
                <RowAction>Abrir</RowAction>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
