import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@/lib/router";
import { RefreshCw, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminUsers, type AdminUser } from "@/services/admin-users";
import { appointmentDate, createAppointment, dateTimeLocalValue, listAppointments, localDateToISO, updateAppointment, type Appointment } from "@/services/appointments";

export const Route = createFileRoute("/admin/citas")({
  head: () => ({meta: [{title: "Gestión de citas — ARCA Med"}]}),
  component: AdminAppointments,
});

function AdminAppointments() {
  const [items,setItems] = useState<Appointment[]>([]);
  const [users,setUsers] = useState<AdminUser[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);
  const [formError,setFormError] = useState<string | null>(null);
  const [editing,setEditing] = useState<Appointment | "new" | null>(null);
  const [saving,setSaving] = useState(false);
  const [patient,setPatient] = useState("");
  const [doctor,setDoctor] = useState("");
  const [when,setWhen] = useState("");
  const [duration,setDuration] = useState(30);
  const [reason,setReason] = useState("");
  const [filter,setFilter] = useState("todos");

  async function load() {
    setLoading(true);setError(null);
    try {
      const [appointments,people] = await Promise.all([listAppointments(),listAdminUsers()]);
      setItems(appointments);setUsers(people);
    } catch (e) {setError(e instanceof Error ? e.message : "No se pudo cargar la agenda.");}
    finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  function openForm(item: Appointment | "new") {
    setFormError(null);setEditing(item);
    if(item === "new") {setPatient("");setDoctor("");setWhen("");setDuration(30);setReason("");}
    else {setPatient(String(item.paciente_id));setDoctor(String(item.medico_id));setWhen(dateTimeLocalValue(item.fecha_hora));setDuration(item.duracion_minutos);setReason(item.motivo ?? "");}
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();setFormError(null);setSaving(true);
    try {
      const iso=localDateToISO(when);
      if(new Date(iso).getTime() <= Date.now()) throw new Error("La cita debe programarse en el futuro.");
      if(editing === "new") {
        if(!patient || !doctor) throw new Error("Selecciona un paciente y un médico.");
        await createAppointment({paciente_id:Number(patient),medico_id:Number(doctor),fecha_hora:iso,duracion_minutos:duration,motivo:reason.trim()||null});
      } else if(editing) {
        await updateAppointment(editing.id,{fecha_hora:iso,duracion_minutos:duration,motivo:reason.trim()||null});
      }
      setEditing(null);await load();
    } catch(e) {setFormError(e instanceof Error ? e.message : "No se pudo guardar la cita.");}
    finally {setSaving(false);}
  }
  async function changeStatus(item: Appointment, status: "cancelada" | "completada") {
    if(!window.confirm(`¿Confirmas marcar esta cita como ${status}?`)) return;
    setError(null);
    try {await updateAppointment(item.id,{estado:status});await load();}
    catch(e) {setError(e instanceof Error?e.message:"No se pudo actualizar la cita.");}
  }
  const filtered=items.filter(item=>filter==="todos" || item.estado===filter);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div>
      <p className="text-xs font-semibold uppercase text-accent">Administración</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">Gestión de citas</h1>
      <p className="mt-2 text-sm text-muted-foreground">Programa y administra citas reales, registradas en ARCA Med.</p>
    </div><div className="flex gap-2"><Button variant="secondary" onClick={()=>void load()} disabled={loading}><RefreshCw className="mr-2 size-4"/>Actualizar</Button><Button onClick={()=>openForm("new")}><Plus className="mr-2 size-4"/>Nueva cita</Button></div></header>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-surface-raised p-3 text-sm text-destructive">{error}</p>}
    <div className="rounded-md border border-border bg-surface-raised p-4">
      <label className="text-sm font-medium" htmlFor="appointment-state">Mostrar: </label>
      <select id="appointment-state" className="ml-2 rounded-md border border-border bg-background px-3 py-2 text-sm" value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todas</option><option value="programada">Programadas</option><option value="completada">Completadas</option><option value="cancelada">Canceladas</option></select>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Cargando citas...</p> : !error && filtered.length===0 ? <p className="mt-4 text-sm text-muted-foreground">No hay citas para el filtro seleccionado.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="px-3 py-2">Fecha y hora</th><th className="px-3 py-2">Paciente</th><th className="px-3 py-2">Médico</th><th className="px-3 py-2">Duración</th><th className="px-3 py-2">Motivo</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Acciones</th></tr></thead><tbody>{filtered.map(item=><tr key={item.id} className="border-b border-border/70"><td className="whitespace-nowrap px-3 py-3">{appointmentDate(item.fecha_hora)}</td><td className="px-3 py-3">{item.paciente_nombre}</td><td className="px-3 py-3">{item.medico_nombre}</td><td className="px-3 py-3">{item.duracion_minutos} min</td><td className="max-w-48 break-words px-3 py-3">{item.motivo || "—"}</td><td className="px-3 py-3 capitalize">{item.estado}</td><td className="px-3 py-3">{item.estado==="programada" ? <div className="flex flex-wrap gap-1"><Button variant="secondary" size="sm" onClick={()=>openForm(item)}>Editar</Button><Button variant="outline" size="sm" onClick={()=>void changeStatus(item,"completada")}>Completar</Button><Button variant="outline" size="sm" onClick={()=>void changeStatus(item,"cancelada")}>Cancelar</Button></div>: <span className="text-muted-foreground">—</span>}</td></tr>)}</tbody></table></div>}
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!saving)setEditing(null);}}><div role="dialog" aria-modal="true" aria-labelledby="appointment-form-title" className="w-full max-w-xl rounded-lg border border-border bg-background p-6 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 id="appointment-form-title" className="font-display text-xl font-semibold">{editing==="new"?"Nueva cita":"Editar cita"}</h2><Button variant="ghost" size="icon" onClick={()=>setEditing(null)} disabled={saving} aria-label="Cerrar"><X className="size-4"/></Button></div><form onSubmit={e=>void submit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Paciente<select required disabled={editing!=="new"} value={patient} onChange={e=>setPatient(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"><option value="">Seleccionar paciente</option>{users.filter(u=>u.rol==="paciente"&&u.activo).map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}</select></label><label className="block text-sm font-medium">Médico<select required disabled={editing!=="new"} value={doctor} onChange={e=>setDoctor(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"><option value="">Seleccionar médico</option>{users.filter(u=>u.rol==="medico"&&u.activo).map(u=><option key={u.id} value={u.id}>{u.nombre}</option>)}</select></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Fecha y hora<input required type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label><label className="block text-sm font-medium">Duración (minutos)<input required type="number" min={10} max={180} value={duration} onChange={e=>setDuration(Number(e.target.value))} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label></div>
      <label className="block text-sm font-medium">Motivo (opcional)<textarea maxLength={500} rows={3} value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
      {formError&&<p role="alert" className="text-sm text-destructive">{formError}</p>}
      <div className="flex justify-end gap-2"><Button variant="secondary" type="button" onClick={()=>setEditing(null)} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving?"Guardando...":"Guardar cita"}</Button></div>
    </form></div></div>}
  </div>;
}
