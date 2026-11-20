import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@/lib/router";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateAppointmentDialog } from "@/components/arca/create-appointment-dialog";
import { appointmentDate, dateTimeLocalValue, localDateToISO, updateAppointment, listAppointments, type Appointment } from "@/services/appointments";

export const Route = createFileRoute("/agenda")({head:()=>({meta:[{title:"Mi agenda — ARCA Med"}]}),component:DoctorAppointments});
function DoctorAppointments() {
 const [items,setItems]=useState<Appointment[]>([]);
 const [error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [filter,setFilter]=useState("proximas");
 const [showCreateAppointment,setShowCreateAppointment]=useState(false);
 const [editing,setEditing]=useState<Appointment|null>(null);
 const [editDate,setEditDate]=useState("");
 const [editDuration,setEditDuration]=useState(30);
 const [editReason,setEditReason]=useState("");
 const [saving,setSaving]=useState(false);
 const [editError,setEditError]=useState("");
 function beginEdit(item:Appointment){setEditing(item);setEditDate(dateTimeLocalValue(item.fecha_hora));setEditDuration(item.duracion_minutos);setEditReason(item.motivo||"");setEditError("");}
 async function saveEdit(event:FormEvent){event.preventDefault();if(!editing)return;setSaving(true);setEditError("");try{
   await updateAppointment(editing.id,{fecha_hora:localDateToISO(editDate),duracion_minutos:editDuration,motivo:editReason.trim()||null});setEditing(null);await load();
 }catch(e){setEditError(e instanceof Error?e.message:"No se pudo actualizar la cita.");}finally{setSaving(false);}}
 async function changeStatus(item:Appointment,status:"cancelada"|"completada"){
   if(!window.confirm(`¿Confirmas marcar esta cita como ${status}?`))return;
   setError(null);try{await updateAppointment(item.id,{estado:status});await load();}catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar la cita.");}}

 async function load(){setLoading(true);setError(null);try{setItems(await listAppointments());}catch(e){setError(e instanceof Error?e.message:"No se pudo consultar la agenda.");}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 const now=Date.now();
 const visible=items.filter(item=> filter==="todas" || (item.estado==="programada" && new Date(item.fecha_hora).getTime()>=now));
 return <><div className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-accent">Espacio clínico</p><h1 className="mt-1 font-display text-3xl font-semibold">Mi agenda médica</h1><p className="mt-2 text-sm text-muted-foreground">Consulta tus citas programadas y agenda nuevas horas de atención para tus pacientes.</p></div><div className="flex flex-wrap items-center gap-2">
  <Button type="button" onClick={()=>setShowCreateAppointment(true)}><Plus className="mr-2 size-4"/>Nueva cita</Button>
  <Button variant="secondary" disabled={loading} onClick={()=>void load()}><RefreshCw className="mr-2 size-4"/>Actualizar</Button>
 </div></header>
 <section className="rounded-md border border-border bg-surface-raised p-5"><div className="flex flex-wrap items-center gap-3"><CalendarDays className="size-5 text-primary"/><h2 className="font-semibold">Citas programadas</h2><select aria-label="Filtrar citas" className="ml-auto rounded-md border border-border bg-background p-2 text-sm" value={filter} onChange={e=>setFilter(e.target.value)}><option value="proximas">Próximas programadas</option><option value="todas">Todas</option></select></div>
 {loading?<p className="mt-5 text-sm text-muted-foreground">Cargando agenda...</p>:error?<p role="alert" className="mt-5 text-sm text-destructive">{error}</p>:visible.length===0?<p className="mt-5 text-sm text-muted-foreground">No hay citas para este filtro.</p>:<div className="mt-4 space-y-3">{visible.map(item=><div key={item.id} className="rounded-md border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item.paciente_nombre}</p><p className="mt-1 text-sm text-muted-foreground">{appointmentDate(item.fecha_hora)} · {item.duracion_minutos} minutos</p></div><span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold capitalize text-primary">{item.estado}</span></div><p className="mt-2 text-sm text-muted-foreground">Especialidad: {item.especialidad_nombre || "No disponible"}</p>{item.motivo&&<p className="mt-3 text-sm">Motivo: {item.motivo}</p>}{item.estado === "programada" && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={()=>beginEdit(item)}>Reprogramar / editar</Button><Button size="sm" variant="outline" onClick={()=>void changeStatus(item,"completada")}>Completar</Button><Button size="sm" variant="outline" onClick={()=>void changeStatus(item,"cancelada")}>Cancelar</Button></div>}<Link to={`/patients/${item.paciente_id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Ver ficha del paciente</Link></div>)}</div>}
 </section></div>
 {editing && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3" onMouseDown={e=>{if(e.target===e.currentTarget && !saving)setEditing(null);}}><div role="dialog" aria-modal="true" aria-labelledby="edit-medical-appointment" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-background p-5 shadow-2xl">
   <h2 id="edit-medical-appointment" className="font-semibold text-lg">Editar cita de {editing.paciente_nombre}</h2>
   <p className="mt-2 text-sm text-muted-foreground">Especialidad: {editing.especialidad_nombre}. No puede cambiarse en una cita existente.</p>
   <form className="mt-4 space-y-3" onSubmit={e=>void saveEdit(e)}>
     <label className="block text-sm">Fecha y hora<input required type="datetime-local" value={editDate} onChange={e=>setEditDate(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
     <label className="block text-sm">Duración (minutos)<input required type="number" min={10} max={180} value={editDuration} onChange={e=>setEditDuration(Number(e.target.value))} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
     <label className="block text-sm">Motivo<textarea maxLength={500} rows={3} value={editReason} onChange={e=>setEditReason(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
     <p className="text-xs text-muted-foreground">El servidor verificará el horario y evitará reservas superpuestas.</p>
     {editError && <p role="alert" className="text-sm text-destructive">{editError}</p>}
     <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" disabled={saving} onClick={()=>setEditing(null)}>Cerrar</Button><Button type="submit" disabled={saving || !editDate}>{saving?"Guardando...":"Guardar cambios"}</Button></div>
   </form></div></div>}
 <CreateAppointmentDialog
   open={showCreateAppointment}
   onClose={()=>setShowCreateAppointment(false)}
   onCreated={load}
 />
 </>;
}
