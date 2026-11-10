import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@/lib/router";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appointmentDate, listAppointments, type Appointment } from "@/services/appointments";

export const Route = createFileRoute("/agenda")({head:()=>({meta:[{title:"Mi agenda — ARCA Med"}]}),component:DoctorAppointments});
function DoctorAppointments() {
 const [items,setItems]=useState<Appointment[]>([]);
 const [error,setError]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [filter,setFilter]=useState("proximas");
 async function load(){setLoading(true);setError(null);try{setItems(await listAppointments());}catch(e){setError(e instanceof Error?e.message:"No se pudo consultar la agenda.");}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 const now=Date.now();
 const visible=items.filter(item=> filter==="todas" || (item.estado==="programada" && new Date(item.fecha_hora).getTime()>=now));
 return <div className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-accent">Espacio clínico</p><h1 className="mt-1 font-display text-3xl font-semibold">Mi agenda médica</h1><p className="mt-2 text-sm text-muted-foreground">Consulta las citas de tu agenda. La creación de citas por médicos estará disponible cuando el backend la autorice.</p></div><div className="flex flex-wrap items-center gap-2">
  <span title="Pendiente de habilitación en el backend: actualmente solo administración puede crear citas.">
   <Button type="button" disabled aria-label="Nueva cita: pendiente de habilitación" className="cursor-not-allowed opacity-60"><Plus className="mr-2 size-4"/>Nueva cita</Button>
  </span>
  <Button variant="secondary" disabled={loading} onClick={()=>void load()}><RefreshCw className="mr-2 size-4"/>Actualizar</Button>
 </div></header>
 <section className="rounded-md border border-border bg-surface-raised p-5"><div className="flex flex-wrap items-center gap-3"><CalendarDays className="size-5 text-primary"/><h2 className="font-semibold">Citas programadas</h2><select aria-label="Filtrar citas" className="ml-auto rounded-md border border-border bg-background p-2 text-sm" value={filter} onChange={e=>setFilter(e.target.value)}><option value="proximas">Próximas programadas</option><option value="todas">Todas</option></select></div>
 {loading?<p className="mt-5 text-sm text-muted-foreground">Cargando agenda...</p>:error?<p role="alert" className="mt-5 text-sm text-destructive">{error}</p>:visible.length===0?<p className="mt-5 text-sm text-muted-foreground">No hay citas para este filtro.</p>:<div className="mt-4 space-y-3">{visible.map(item=><div key={item.id} className="rounded-md border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{item.paciente_nombre}</p><p className="mt-1 text-sm text-muted-foreground">{appointmentDate(item.fecha_hora)} · {item.duracion_minutos} minutos</p></div><span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold capitalize text-primary">{item.estado}</span></div>{item.motivo&&<p className="mt-3 text-sm">Motivo: {item.motivo}</p>}<Link to={`/patients/${item.paciente_id}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Ver ficha del paciente</Link></div>)}</div>}
 </section></div>;
}
