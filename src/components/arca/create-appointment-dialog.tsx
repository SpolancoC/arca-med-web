import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMedicalPatients,
  type RegisteredPatient,
} from "@/services/patients";
import { getProfile } from "@/services/profile";
import { createAppointment, localDateToISO } from "@/services/appointments";
import { ApiError } from "@/services/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  initialDate?: string;
};

/** Muestra y recibe la fecha en formato chileno dd/mm/aaaa. */
function formatInitialDate(isoDate?: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function maskDate(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
}

function toLocalDateTime(date: string, time: string): string {
  const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!dateMatch) throw new Error("Ingresa la fecha como dd/mm/aaaa.");
  const [, dd, mm, yyyy] = dateMatch;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const calendarDate = new Date(year, month - 1, day);
  if (
    year < 1900 ||
    year > 9999 ||
    calendarDate.getFullYear() !== year ||
    calendarDate.getMonth() !== month - 1 ||
    calendarDate.getDate() !== day
  ) {
    throw new Error("Ingresa una fecha válida.");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error("Ingresa una hora válida de 00:00 a 23:59.");
  }
  return `${yyyy}-${mm}-${dd}T${time}`;
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
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(() => formatInitialDate(initialDate));
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patientSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([getMedicalPatients(), getProfile()])
      .then(([list, profile]) => {
        if (!active) return;
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
    if (!doctorId || !patientId) {
      setError("Selecciona un paciente.");
      return;
    }
    try {
      const iso = localDateToISO(toLocalDateTime(date, `${hour}:${minute}`));
      if (new Date(iso).getTime() <= Date.now()) {
        throw new Error(
          "La cita debe programarse para una fecha y hora futuras.",
        );
      }
      setSaving(true);
      await createAppointment({
        paciente_id: Number(patientId),
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Fecha
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  value={date}
                  onChange={(event) => setDate(maskDate(event.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
                  aria-label="Fecha en formato día, mes y año"
                />
              </label>
              <div className="block text-sm font-medium">
                <span id="appointment-hour-label">Hora</span>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    required
                    value={hour}
                    onChange={(event) => setHour(event.target.value)}
                    aria-label="Hora"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background p-2 text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) =>
                      String(i).padStart(2, "0"),
                    ).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden="true">:</span>
                  <select
                    required
                    value={minute}
                    onChange={(event) => setMinute(event.target.value)}
                    aria-label="Minutos"
                    className="min-w-0 flex-1 rounded-md border border-border bg-background p-2 text-sm"
                  >
                    {Array.from({ length: 60 }, (_, i) =>
                      String(i).padStart(2, "0"),
                    ).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
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
                disabled={saving || !doctorId || patients.length === 0}
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
