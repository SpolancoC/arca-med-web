import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMedicalPatients,
  type RegisteredPatient,
} from "@/services/patients";
import { getProfile } from "@/services/profile";
import {
  createAppointment,
  listAppointments,
  listSpecialties,
  type Specialty,
  localDateToISO,
  isSameLocalDay,
  type Appointment,
} from "@/services/appointments";
import { ApiError } from "@/services/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  initialDate?: string;
};

const WORK_START = 8 * 60;
const WORK_END = 17 * 60;
const SLOT_STEP = 30;

function dateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date;
}

function toLocalDateTime(date: string, time: string): string {
  if (!dateFromKey(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Selecciona una fecha y hora válidas.");
  }
  return `${date}T${time}`;
}

function freeSlots(
  date: string,
  duration: number,
  appointments: Appointment[],
): string[] {
  if (!dateFromKey(date)) return [];
  const now = Date.now();
  const taken = appointments.filter(
    (appointment) =>
      appointment.estado === "programada" &&
      isSameLocalDay(appointment.fecha_hora, date),
  );
  const slots: string[] = [];
  for (
    let minuteOfDay = WORK_START;
    minuteOfDay + duration <= WORK_END;
    minuteOfDay += SLOT_STEP
  ) {
    const hh = String(Math.floor(minuteOfDay / 60)).padStart(2, "0");
    const mm = String(minuteOfDay % 60).padStart(2, "0");
    const start = new Date(`${date}T${hh}:${mm}`).getTime();
    const end = start + duration * 60_000;
    if (start <= now) continue;
    const overlapping = taken.some((appointment) => {
      const reservedStart = new Date(appointment.fecha_hora).getTime();
      const reservedEnd = reservedStart + appointment.duracion_minutos * 60_000;
      return start < reservedEnd && end > reservedStart;
    });
    if (!overlapping) slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/** Ventana compartida por el panel médico y la agenda. */
export function CreateAppointmentDialog(props: Props) {
  if (!props.open) return null;
  return (
    <AppointmentDialogContent
      onClose={props.onClose}
      onCreated={props.onCreated}
      initialDate={props.initialDate}
    />
  );
}

function AppointmentDialogContent({
  onClose,
  onCreated,
  initialDate,
}: Omit<Props, "open">) {
  const [patients, setPatients] = useState<RegisteredPatient[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialtyId, setSpecialtyId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(() =>
    initialDate && dateFromKey(initialDate) ? initialDate : dateKey(new Date()),
  );
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [timesError, setTimesError] = useState<string | null>(null);
  const [refreshTimes, setRefreshTimes] = useState(0);
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patientSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([getMedicalPatients(), getProfile(), listSpecialties()])
      .then(([list, profile, specialtyList]) => {
        if (!active) return;
        setSpecialties(specialtyList);
        if (profile.rol !== "medico") {
          throw new Error(
            "Solo los médicos pueden agendar desde este formulario.",
          );
        }
        setPatients(list);
        setDoctorId(profile.id);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No fue posible cargar los pacientes.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Consultar las citas del médico para el día elegido (con límites en hora local).
  useEffect(() => {
    if (!doctorId || !dateFromKey(date)) {
      setAppointments([]);
      return;
    }
    let active = true;
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    setLoadingTimes(true);
    setTimesError(null);
    setAppointments([]);
    void listAppointments({
      medico_id: doctorId,
      desde: start.toISOString(),
      hasta: end.toISOString(),
    })
      .then((result) => {
        if (active) setAppointments(result);
      })
      .catch((cause: unknown) => {
        if (active)
          setTimesError(
            cause instanceof Error
              ? cause.message
              : "No se pudo consultar la disponibilidad.",
          );
      })
      .finally(() => {
        if (active) setLoadingTimes(false);
      });
    return () => {
      active = false;
    };
  }, [doctorId, date, refreshTimes]);

  const availableTimes = useMemo(
    () => freeSlots(date, duration, appointments),
    [date, duration, appointments],
  );
  const availableHours = useMemo(
    () => Array.from(new Set(availableTimes.map((time) => time.slice(0, 2)))),
    [availableTimes],
  );
  const availableMinutes = useMemo(
    () =>
      availableTimes
        .filter((time) => time.startsWith(`${hour}:`))
        .map((time) => time.slice(3)),
    [availableTimes, hour],
  );

  useEffect(() => {
    if (loadingTimes || timesError) {
      setHour("");
      setMinute("");
      return;
    }
    if (!availableTimes.includes(`${hour}:${minute}`)) {
      const first = availableTimes[0] ?? "";
      setHour(first ? first.slice(0, 2) : "");
      setMinute(first ? first.slice(3) : "");
    }
  }, [availableTimes, hour, minute, loadingTimes, timesError]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () => patientSelectRef.current?.focus(),
      0,
    );
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [saving, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!doctorId || !patientId || !specialtyId) {
      setError("Selecciona un paciente y una especialidad.");
      return;
    }
    try {
      if (loadingTimes || timesError)
        throw new Error("Espera a cargar la disponibilidad antes de agendar.");
      if (!availableTimes.includes(`${hour}:${minute}`))
        throw new Error("El horario elegido ya no está disponible.");
      const iso = localDateToISO(toLocalDateTime(date, `${hour}:${minute}`));
      if (new Date(iso).getTime() <= Date.now()) {
        throw new Error(
          "La cita debe programarse para una fecha y hora futuras.",
        );
      }
      setSaving(true);
      const startDay = new Date(`${date}T00:00:00`);
      const nextDay = new Date(startDay);
      nextDay.setDate(nextDay.getDate() + 1);
      const latest = await listAppointments({
        medico_id: doctorId,
        desde: startDay.toISOString(),
        hasta: nextDay.toISOString(),
      });
      if (!freeSlots(date, duration, latest).includes(`${hour}:${minute}`)) {
        setAppointments(latest);
        throw new Error(
          "Esa hora acaba de ocuparse. Selecciona otro horario disponible.",
        );
      }
      await createAppointment({
        paciente_id: Number(patientId),
        especialidad_id: Number(specialtyId),
        medico_id: doctorId,
        fecha_hora: iso,
        duracion_minutos: duration,
        motivo: reason.trim() || null,
      });
      onClose();
      await onCreated();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403) {
        setError(
          "El servidor todavía no autoriza a médicos para crear citas. Se debe habilitar POST /citas en el backend.",
        );
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo agendar la cita.",
        );
        if (
          cause instanceof ApiError &&
          (cause.status === 400 || cause.status === 409)
        ) {
          setRefreshTimes((current) => current + 1);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-dialog-title"
        aria-describedby="appointment-dialog-description"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="appointment-dialog-title"
              className="font-display text-xl font-semibold"
            >
              Agendar nueva cita
            </h2>
            <p
              id="appointment-dialog-description"
              className="mt-1 text-sm text-muted-foreground"
            >
              Selecciona un paciente, una fecha y el horario de atención.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar ventana"
          >
            <X className="size-4" />
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando pacientes...</p>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <label className="block text-sm font-medium">
              Paciente
              <select
                ref={patientSelectRef}
                required
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              >
                <option value="">Seleccionar paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.nombre}
                  </option>
                ))}
              </select>
            </label>
            {patients.length === 0 && !error && (
              <p className="text-xs text-muted-foreground">
                No hay pacientes disponibles para agendar.
              </p>
            )}
            <label className="block text-sm font-medium">Especialidad
              <select required value={specialtyId} onChange={event => setSpecialtyId(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm">
                <option value="">Seleccionar especialidad</option>
                {specialties.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Fecha
                <input
                  required
                  type="date"
                  min={dateKey(new Date())}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
                  aria-label="Seleccionar fecha desde el calendario"
                />
              </label>
              <div className="block text-sm font-medium">
                <span>Hora disponible</span>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    required
                    value={hour}
                    disabled={
                      loadingTimes ||
                      !!timesError ||
                      availableHours.length === 0
                    }
                    onChange={(event) => {
                      const newHour = event.target.value;
                      setHour(newHour);
                      setMinute(
                        availableTimes
                          .find((time) => time.startsWith(`${newHour}:`))
                          ?.slice(3) ?? "",
                      );
                    }}
                    aria-label="Hora"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background p-2 text-sm"
                  >
                    {availableHours.length === 0 && (
                      <option value="">--</option>
                    )}
                    {availableHours.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden="true">:</span>
                  <select
                    required
                    value={minute}
                    disabled={
                      loadingTimes ||
                      !!timesError ||
                      availableMinutes.length === 0
                    }
                    onChange={(event) => setMinute(event.target.value)}
                    aria-label="Minutos disponibles"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background p-2 text-sm"
                  >
                    {availableMinutes.length === 0 && (
                      <option value="">--</option>
                    )}
                    {availableMinutes.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {loadingTimes && (
              <p className="text-xs text-muted-foreground">
                Consultando horarios disponibles...
              </p>
            )}
            {timesError && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <span>No se pudo consultar la agenda: {timesError}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRefreshTimes((n) => n + 1)}
                >
                  Reintentar
                </Button>
              </div>
            )}
            {!loadingTimes && !timesError && availableTimes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No quedan horas disponibles para esa fecha y duración entre las
                08:00 y las 17:00.
              </p>
            )}
            <label className="block text-sm font-medium">
              Duración
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              >
                {[15, 30, 45, 60, 90, 120].map((minutes) => (
                  <option value={minutes} key={minutes}>
                    {minutes} minutos
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Motivo de consulta (opcional)
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ej. Control médico"
                className="mt-1 w-full resize-y rounded-md border border-border bg-background p-2 text-sm"
              />
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  loadingTimes ||
                  !!timesError ||
                  !doctorId ||
                  !patientId ||
                  !availableTimes.includes(`${hour}:${minute}`)
                }
              >
                {saving ? "Guardando..." : "Agendar cita"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
