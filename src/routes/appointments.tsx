import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@/lib/router";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminUsers, type AdminUser } from "@/services/admin-users";
import {
  appointmentDate,
  createAppointment,
  dateTimeLocalValue,
  listAppointments,
  localDateToISO,
  updateAppointment,
  type Appointment,
} from "@/services/appointments";

export const Route = createFileRoute("/admin/citas")({
  head: () => ({ meta: [{ title: "Gestión de citas — ARCA Med" }] }),
  component: AdminAppointments,
});

const START_HOUR = 8;
const END_HOUR = 17; // La cita debe terminar a más tardar a las 17:00.
const SLOT_MINUTES = 30;
const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromKey = (key: string) => new Date(`${key}T12:00:00`);
const localSlot = (day: string, hour: string) => new Date(`${day}T${hour}:00`);
const monthHeading = (date: Date) => new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(date);
const dayHeading = (key: string) => new Intl.DateTimeFormat("es-CL", { dateStyle: "full" }).format(dateFromKey(key));

function slotsForDay(day: string, duration: number, doctorId: string, appointments: Appointment[], excludedId?: number) {
  if (!day || !doctorId || !Number.isFinite(duration) || duration < 10 || duration > 180) return [];
  const result: string[] = [];
  const now = Date.now();
  for (let minute = START_HOUR * 60; minute + duration <= END_HOUR * 60; minute += SLOT_MINUTES) {
    const time = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;
    const start = localSlot(day, time).getTime();
    if (!Number.isFinite(start) || start <= now) continue;
    const end = start + duration * 60_000;
    const overlaps = appointments.some(cita => {
      if (cita.id === excludedId || cita.estado !== "programada" || cita.medico_id !== Number(doctorId)) return false;
      const reservedStart = new Date(cita.fecha_hora).getTime();
      const reservedEnd = reservedStart + cita.duracion_minutos * 60_000;
      return start < reservedEnd && end > reservedStart;
    });
    if (!overlaps) result.push(time);
  }
  return result;
}

function CalendarSelector({ selected, month, onMonthChange, onSelect }: {
  selected: string;
  month: Date;
  onMonthChange: (value: Date) => void;
  onSelect: (value: string) => void;
}) {
  const today = dateKey(new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index - offset + 1));
  const canGoBack = first.getFullYear() > new Date().getFullYear()
    || (first.getFullYear() === new Date().getFullYear() && first.getMonth() > new Date().getMonth());
  return <div className="rounded-md border border-border bg-surface-raised p-3">
    <div className="mb-3 flex items-center justify-between gap-2">
      <Button type="button" variant="ghost" size="icon" aria-label="Mes anterior" disabled={!canGoBack}
        onClick={() => onMonthChange(new Date(first.getFullYear(), first.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button>
      <span className="text-sm font-semibold capitalize">{monthHeading(first)}</span>
      <Button type="button" variant="ghost" size="icon" aria-label="Mes siguiente"
        onClick={() => onMonthChange(new Date(first.getFullYear(), first.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center">
      {WEEKDAYS.map(label => <span className="py-1 text-xs font-medium text-muted-foreground" key={label}>{label}</span>)}
      {days.map(day => {
        const key = dateKey(day);
        const inMonth = day.getMonth() === first.getMonth();
        const isPast = key < today;
        return <button key={key} type="button" disabled={!inMonth || isPast}
          aria-label={new Intl.DateTimeFormat("es-CL", { dateStyle: "full" }).format(day)}
          aria-pressed={selected === key}
          onClick={() => onSelect(key)}
          className={`min-h-9 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-25 ${selected === key ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-primary-soft/60"}`}>
          {day.getDate()}
        </button>;
      })}
    </div>
  </div>;
}

function AdminAppointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Appointment | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState("");
  const [doctor, setDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [filter, setFilter] = useState("todos");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [appointments, people] = await Promise.all([listAppointments(), listAdminUsers()]);
      setItems(appointments);
      setUsers(people);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la agenda.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  // Actualizamos las reservas cuando se abre el formulario para no ofrecer horarios con información antigua.
  useEffect(() => {
    if (!editing) return;
    let active = true;
    setCheckingAvailability(true);
    setAvailabilityError(null);
    void listAppointments().then(appointments => {
      if (active) setItems(appointments);
    }).catch(e => {
      if (active) setAvailabilityError(e instanceof Error ? e.message : "No se pudo consultar los horarios ocupados.");
    }).finally(() => { if (active) setCheckingAvailability(false); });
    return () => { active = false; };
  }, [editing]);

  function openForm(item: Appointment | "new") {
    setFormError(null);
    if (item === "new") {
      setPatient(""); setDoctor(""); setSelectedDate(""); setSelectedTime(""); setDuration(30); setReason("");
      setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    } else {
      const local = dateTimeLocalValue(item.fecha_hora);
      setPatient(String(item.paciente_id)); setDoctor(String(item.medico_id));
      setSelectedDate(local.slice(0, 10)); setSelectedTime(local.slice(11, 16));
      setCalendarMonth(new Date(dateFromKey(local.slice(0, 10)).getFullYear(), dateFromKey(local.slice(0, 10)).getMonth(), 1));
      setDuration(item.duracion_minutos); setReason(item.motivo ?? "");
    }
    setEditing(item);
  }

  const availableTimes = useMemo(() => slotsForDay(
    selectedDate, duration, doctor, items, editing && editing !== "new" ? editing.id : undefined,
  ), [selectedDate, duration, doctor, items, editing]);
  const timeAvailable = availableTimes.includes(selectedTime);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    setFormError(null);
    setSaving(true);
    try {
      if (!selectedDate || !selectedTime || !doctor) throw new Error("Selecciona médico, día y hora disponibles.");
      if (!Number.isInteger(duration) || duration < 10 || duration > 180) throw new Error("La duración debe estar entre 10 y 180 minutos.");
      // Comprobar una última vez. Si otro usuario reservó mientras tanto, el servidor también rechazará el solapamiento.
      const fresh = await listAppointments();
      setItems(fresh);
      const options = slotsForDay(selectedDate, duration, doctor, fresh, editing === "new" ? undefined : editing.id);
      if (!options.includes(selectedTime)) throw new Error("Ese horario ya no está disponible. Selecciona otra hora.");
      const iso = localDateToISO(`${selectedDate}T${selectedTime}`);
      if (editing === "new") {
        if (!patient) throw new Error("Selecciona un paciente.");
        await createAppointment({ paciente_id: Number(patient), medico_id: Number(doctor), fecha_hora: iso, duracion_minutos: duration, motivo: reason.trim() || null });
      } else {
        await updateAppointment(editing.id, { fecha_hora: iso, duracion_minutos: duration, motivo: reason.trim() || null });
      }
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo guardar la cita.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: Appointment, status: "cancelada" | "completada") {
    if (!window.confirm(`¿Confirmas marcar esta cita como ${status}?`)) return;
    setError(null);
    try { await updateAppointment(item.id, { estado: status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo actualizar la cita."); }
  }
  const filtered = items.filter(item => filter === "todos" || item.estado === filter);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div>
      <p className="text-xs font-semibold uppercase text-accent">Administración</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">Gestión de citas</h1>
      <p className="mt-2 text-sm text-muted-foreground">Programa y administra citas reales, registradas en ARCA Med.</p>
    </div><div className="flex gap-2"><Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 size-4" />Actualizar</Button><Button onClick={() => openForm("new")}><Plus className="mr-2 size-4" />Nueva cita</Button></div></header>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-surface-raised p-3 text-sm text-destructive">{error}</p>}
    <div className="rounded-md border border-border bg-surface-raised p-4">
      <label className="text-sm font-medium" htmlFor="appointment-state">Mostrar: </label>
      <select id="appointment-state" className="ml-2 rounded-md border border-border bg-background px-3 py-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">Todas</option><option value="programada">Programadas</option><option value="completada">Completadas</option><option value="cancelada">Canceladas</option></select>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Cargando citas...</p> : !error && filtered.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No hay citas para el filtro seleccionado.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="px-3 py-2">Fecha y hora</th><th className="px-3 py-2">Paciente</th><th className="px-3 py-2">Médico</th><th className="px-3 py-2">Duración</th><th className="px-3 py-2">Motivo</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Acciones</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="border-b border-border/70"><td className="whitespace-nowrap px-3 py-3">{appointmentDate(item.fecha_hora)}</td><td className="px-3 py-3">{item.paciente_nombre}</td><td className="px-3 py-3">{item.medico_nombre}</td><td className="px-3 py-3">{item.duracion_minutos} min</td><td className="max-w-48 break-words px-3 py-3">{item.motivo || "—"}</td><td className="px-3 py-3 capitalize">{item.estado}</td><td className="px-3 py-3">{item.estado === "programada" ? <div className="flex flex-wrap gap-1"><Button variant="secondary" size="sm" onClick={() => openForm(item)}>Editar</Button><Button variant="outline" size="sm" onClick={() => void changeStatus(item, "completada")}>Completar</Button><Button variant="outline" size="sm" onClick={() => void changeStatus(item, "cancelada")}>Cancelar</Button></div> : <span className="text-muted-foreground">—</span>}</td></tr>)}</tbody></table></div>}
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditing(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="appointment-form-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between"><h2 id="appointment-form-title" className="font-display text-xl font-semibold">{editing === "new" ? "Nueva cita" : "Editar cita"}</h2><Button variant="ghost" size="icon" onClick={() => setEditing(null)} disabled={saving} aria-label="Cerrar"><X className="size-4" /></Button></div>
        <form onSubmit={e => void submit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Paciente<select required disabled={editing !== "new"} value={patient} onChange={e => setPatient(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"><option value="">Seleccionar paciente</option>{users.filter(u => u.rol === "paciente" && u.activo).map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select></label><label className="block text-sm font-medium">Médico<select required disabled={editing !== "new"} value={doctor} onChange={e => { setDoctor(e.target.value); setSelectedTime(""); }} className="mt-1 w-full rounded-md border border-border bg-background p-2"><option value="">Seleccionar médico</option>{users.filter(u => u.rol === "medico" && u.activo).map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select></label></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="size-4" />Fecha de la cita</span>
              <CalendarSelector selected={selectedDate} month={calendarMonth} onMonthChange={setCalendarMonth} onSelect={date => { setSelectedDate(date); setSelectedTime(""); }} />
              <p className="text-xs text-muted-foreground">{selectedDate ? dayHeading(selectedDate) : "Selecciona un día del calendario."}</p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">Duración (minutos)<input required type="number" min={10} max={180} value={duration} onChange={e => { setDuration(Number(e.target.value)); setSelectedTime(""); }} className="mt-1 w-full rounded-md border border-border bg-background p-2" /></label>
              <div>
                <span className="block text-sm font-medium">Horas disponibles</span>
                <p className="mt-1 text-xs text-muted-foreground">Atenciones entre las 08:00 y las 17:00, con inicio cada 30 minutos. La cita debe terminar antes de las 17:00.</p>
                {checkingAvailability ? <p className="mt-3 text-sm text-muted-foreground">Consultando disponibilidad...</p> : availabilityError ? <div className="mt-3 space-y-2"><p role="alert" className="text-sm text-destructive">No se pudo consultar la agenda: {availabilityError}</p><Button type="button" variant="secondary" size="sm" onClick={() => { setCheckingAvailability(true); setAvailabilityError(null); void listAppointments().then(setItems).catch(e => setAvailabilityError(e instanceof Error ? e.message : "Error al consultar citas")).finally(() => setCheckingAvailability(false)); }}>Reintentar</Button></div> : !selectedDate || !doctor ? <p className="mt-3 text-sm text-muted-foreground">Selecciona primero médico y fecha.</p> : availableTimes.length === 0 ? <p className="mt-3 rounded-md bg-surface-raised p-3 text-sm text-muted-foreground">No hay horas disponibles para este día y duración.</p> : <div className="mt-3 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto" role="group" aria-label="Seleccionar horario disponible">{availableTimes.map(time => <button type="button" key={time} aria-pressed={selectedTime === time} onClick={() => setSelectedTime(time)} className={`rounded-md border px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedTime === time ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-raised hover:border-primary/40 hover:bg-primary-soft/40"}`}>{time}</button>)}</div>}
              </div>
            </div>
          </div>
          <label className="block text-sm font-medium">Motivo (opcional)<textarea maxLength={500} rows={3} value={reason} onChange={e => setReason(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2" /></label>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving || checkingAvailability || !!availabilityError || !selectedDate || !timeAvailable || !doctor}>{saving ? "Guardando..." : "Guardar cita"}</Button></div>
        </form>
      </div>
    </div>}
  </div>;
}
