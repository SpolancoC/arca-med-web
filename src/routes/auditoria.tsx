import { createFileRoute } from "@/lib/router";
import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listarAuditoria, verificarAuditoria, type AuditoriaLog, type AuditoriaVerificacion } from "@/services/auditoria";

export const Route = createFileRoute("/auditoria")({
  head: () => ({ meta: [{ title: "Auditoría — ARCA Med" }] }),
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const [registros, setRegistros] = useState<AuditoriaLog[]>([]);
  const [verificacion, setVerificacion] = useState<AuditoriaVerificacion | null>(null);
  const [usuario, setUsuario] = useState("");
  const [afectado, setAfectado] = useState("");
  const [accion, setAccion] = useState("");
  const [limite, setLimite] = useState("100");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  async function cargar(filtros = { usuario, afectado, accion, limite }) {
    setLoading(true); setError(null);
    try {
      const data = await listarAuditoria({
        usuario_id: filtros.usuario.trim() ? Number(filtros.usuario) : undefined,
        usuario_afectado_id: filtros.afectado.trim() ? Number(filtros.afectado) : undefined,
        accion: filtros.accion.trim() || undefined,
        limite: Number(filtros.limite),
      });
      setRegistros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el historial.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void cargar({ usuario: "", afectado: "", accion: "", limite: "100" }); }, []);

  async function comprobar() {
    setChecking(true); setCheckError(null);
    try { setVerificacion(await verificarAuditoria()); }
    catch (err) { setCheckError(err instanceof Error ? err.message : "No se pudo comprobar la integridad."); }
    finally { setChecking(false); }
  }

  const fieldClass = "w-full min-w-0 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Administración</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Auditoría</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta las acciones registradas y verifica la integridad del historial.</p>
        </div>
        <Button variant="secondary" onClick={() => void comprobar()} disabled={checking}>
          <ShieldCheck className="mr-2 size-4" />{checking ? "Verificando..." : "Verificar integridad"}
        </Button>
      </div>

      {(verificacion || checkError) && (
        <div role="status" className="rounded-md border border-border bg-surface-raised p-4 text-sm">
          {checkError ? <p className="text-destructive">{checkError}</p> : verificacion && (
            <div className="flex items-start gap-2">
              {verificacion.integra ? <ShieldCheck className="size-5 shrink-0 text-primary" /> : <ShieldAlert className="size-5 shrink-0 text-destructive" />}
              <div><p className="font-semibold">{verificacion.integra ? "Integridad verificada" : "Se detectó un problema de integridad"}</p>
                <p className="text-muted-foreground">{verificacion.total_revisados} registros comprobados{verificacion.id_con_error !== null ? ` · Registro ${verificacion.id_con_error}` : ""}.</p>
                {verificacion.motivo && <p className="mt-1 text-destructive">{verificacion.motivo}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <section className="rounded-md border border-border bg-surface-raised p-4">
        <h2 className="mb-3 text-sm font-semibold">Filtros de búsqueda</h2>
        <form onSubmit={e => { e.preventDefault(); void cargar(); }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-xs text-muted-foreground">ID de usuario
            <input className={fieldClass} type="number" min="1" value={usuario} onChange={e=>setUsuario(e.target.value)} placeholder="Todos" />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">ID de usuario afectado
            <input className={fieldClass} type="number" min="1" value={afectado} onChange={e=>setAfectado(e.target.value)} placeholder="Todos" />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">Acción exacta
            <input className={fieldClass} value={accion} onChange={e=>setAccion(e.target.value)} placeholder="Ej.: ver_resumen" />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">Máximo de registros
            <select className={fieldClass} value={limite} onChange={e=>setLimite(e.target.value)}>
              {[25,50,100,250,500].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2"><Button type="submit" disabled={loading}><ClipboardList className="mr-2 size-4" />{loading ? "Cargando..." : "Consultar"}</Button>
            <Button type="button" variant="secondary" onClick={() => {setUsuario("");setAfectado("");setAccion("");setLimite("100");void cargar({usuario:"",afectado:"",accion:"",limite:"100"});}} aria-label="Limpiar filtros"><RefreshCw className="size-4" /></Button></div>
        </form>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-surface-raised">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Historial de acciones</h2>
          <span className="text-xs text-muted-foreground">{registros.length} registros mostrados</span>
        </div>
        {error && <p role="alert" className="p-4 text-sm text-destructive">{error}</p>}
        {!error && !loading && registros.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No hay registros para los filtros seleccionados.</p>}
        {!error && loading && <p className="p-4 text-sm text-muted-foreground">Cargando historial...</p>}
        {!error && !loading && registros.length > 0 && <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{["Fecha", "Usuario", "Rol", "Acción", "Afectado", "IP", "Detalle"].map(x=><th key={x} className="whitespace-nowrap px-4 py-3 font-semibold">{x}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">{registros.map(log=><tr key={log.id} className="align-top hover:bg-muted/20">
              <td className="whitespace-nowrap px-4 py-3">{new Date(log.fecha).toLocaleString("es-CL")}</td>
              <td className="px-4 py-3">{log.usuario_id ?? "—"}</td>
              <td className="px-4 py-3 capitalize">{log.rol}</td>
              <td className="px-4 py-3 font-medium">{log.accion.replaceAll("_", " ")}</td>
              <td className="px-4 py-3">{log.usuario_afectado_id ?? "—"}</td>
              <td className="px-4 py-3">{log.ip ?? "—"}</td>
              <td className="max-w-[320px] break-words px-4 py-3 text-muted-foreground">{log.detalle ?? "—"}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
    </div>
  );
}
