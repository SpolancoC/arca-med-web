import { createFileRoute, Link } from "@/lib/router";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/today")({
  head:()=>({meta:[{title:"Agenda médica — ARCA Med"}]}),
  component:AgendaRedirect,
});
function AgendaRedirect(){
 return <div className="space-y-5 rounded-md border border-border bg-surface-raised p-6">
  <h1 className="font-display text-2xl font-semibold">Agenda médica</h1>
  <p className="text-sm text-muted-foreground">La agenda ya está conectada al servicio de citas del backend. Consulta tus citas asignadas desde Mi agenda.</p>
  <Button asChild><Link to="/agenda"><CalendarDays className="mr-2 size-4"/>Abrir mi agenda</Link></Button>
 </div>;
}
