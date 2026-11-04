import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@/lib/router";
import { Activity, ArrowRight, BookMarked, BookOpen, RefreshCw, ShieldCheck, Users, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminUsers } from "@/services/admin-users";
import type { AdminUser } from "@/services/admin-users";

export const Route = createFileRoute("/admin/inicio")({
  head: () => ({ meta: [{ title: "Inicio administrativo — ARCA Med" }] }),
  component: AdminHomePage,
});

const shortcuts = [
  { name: "Pacientes", description: "Consultar y administrar los pacientes registrados.", to: "/patients", icon: Users },
  { name: "Usuarios", description: "Gestionar cuentas y permisos de acceso.", to: "/admin/usuarios", icon: UserCog },
  { name: "Ejercicios", description: "Administrar la biblioteca de ejercicios.", to: "/exercises", icon: BookOpen },
  { name: "Guías clínicas", description: "Consultar y crear guías clínicas.", to: "/guias-clinicas", icon: BookMarked },
  { name: "Auditoría", description: "Consultar los eventos registrados y verificar su integridad.", to: "/auditoria", icon: ShieldCheck },
] as const;

function AdminHomePage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminUsers();
      setUsers(data);
    } catch (cause) {
      setUsers(null);
      setError(cause instanceof Error ? cause.message : "No se pudieron consultar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const active = users?.filter((user) => user.activo) ?? [];
  const indicators = [
    { label: "Pacientes activos", count: active.filter((user) => user.rol === "paciente").length, note: "Cuentas activas con rol paciente" },
    { label: "Médicos activos", count: active.filter((user) => user.rol === "medico").length, note: "Cuentas activas con rol médico" },
    { label: "Administradores activos", count: active.filter((user) => user.rol === "admin").length, note: "Cuentas activas con rol administrador" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Administración</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Panel de inicio</h1>
          <p className="mt-2 text-sm text-muted-foreground">Accede a las herramientas administrativas de ARCA Med.</p>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-2 size-4" />{loading ? "Actualizando..." : "Actualizar datos"}
        </Button>
      </header>

      <section aria-labelledby="summary-title" className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-accent" />
          <h2 id="summary-title" className="text-base font-semibold">Resumen de usuarios</h2>
        </div>
        <p className="text-xs text-muted-foreground">Conteos obtenidos del directorio administrativo. No representan consultas ni actividad clínica.</p>
        {error && <p role="alert" className="rounded-md border border-border bg-surface-raised p-3 text-sm text-destructive">No se pudieron actualizar los indicadores: {error}</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          {indicators.map((item) => (
            <div key={item.label} className="rounded-md border border-border bg-surface-raised p-5">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold" aria-label={loading ? "Cargando" : error ? "Dato no disponible" : String(item.count)}>
                {loading ? "…" : error ? "—" : item.count}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="actions-title" className="space-y-3">
        <h2 id="actions-title" className="text-base font-semibold">Accesos rápidos</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map(({ name, description, to, icon: Icon }) => (
            <Link key={to} to={to} className="group flex min-h-32 flex-col justify-between rounded-md border border-border bg-surface-raised p-5 transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-md bg-primary-soft text-primary"><Icon className="size-4" /></span>
                <h3 className="font-semibold">{name}</h3>
              </div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-sm text-muted-foreground">{description}</p>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
