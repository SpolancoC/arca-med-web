import { Link, useNavigate, useRouterState } from "@/lib/router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  ShieldCheck,
  Bell,
  BookOpen,
  BookMarked,
  ChevronLeft,
  CircleHelp,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProfile, type UserProfile } from "@/services/profile";

const nav = [
  { label: "Panel principal", to: "/", icon: LayoutDashboard },
  { label: "Pacientes", to: "/patients", icon: Users },
  { label: "Evaluaciones", to: "/evaluations", icon: ClipboardCheck },
  { label: "Triaje", to: "/triage", icon: Activity },
  { label: "Ejercicios", to: "/exercises", icon: BookOpen },
  { label: "Historial", to: "/history", icon: History },
] as const;

const adminNav = [
  { label: "Pacientes", to: "/patients", icon: Users },
  { label: "Usuarios", to: "/admin/usuarios", icon: UserCog },
  { label: "Ejercicios", to: "/exercises", icon: BookOpen },
  { label: "Auditoría", to: "/auditoria", icon: ShieldCheck },
  { label: "Guías clínicas", to: "/guias-clinicas", icon: BookMarked },
];
const pacienteNav = [{ label: "Mi espacio", to: "/mi-espacio", icon: Activity }];
const medicoNav = [...nav.filter(item => item.to !== "/exercises"),
  { label: "Guías clínicas", to: "/guias-clinicas", icon: BookMarked },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navigate = useNavigate();
  const currentNav = profile?.rol === "admin" ? adminNav : profile?.rol === "paciente" ? pacienteNav : medicoNav;
  const title = pathname.includes("/evaluation/camera")
    ? "Cámara de evaluación"
    : pathname.endsWith("/evaluation")
      ? "Nueva evaluación"
      : pathname.startsWith("/patients/")
        ? "Ficha del paciente"
        : (currentNav.find((item) => item.to === pathname)?.label ??
          "Espacio clínico");

  if (pathname === "/login") return children;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {open && (
        <button
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-30 bg-overlay lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-sidebar/90 px-4 py-5 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[76px]",
        )}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1">
          <Link to={profile?.rol === "admin" ? "/patients" : profile?.rol === "paciente" ? "/mi-espacio" : "/"} className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary font-display text-base font-semibold text-primary-foreground">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate font-display text-base font-semibold">
                  ARCA Med
                </p>
                <p className="truncate text-[10px] font-semibold uppercase text-muted-foreground">
                  Evaluación Articular
                </p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Cerrar navegación"
          >
            <X className="size-4" />
          </Button>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {!collapsed && (
            <span className="mb-1 px-2 text-[10px] font-semibold uppercase text-muted-foreground">
              Espacio de trabajo
            </span>
          )}
          {currentNav.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex min-h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active &&
                    "bg-primary-soft font-semibold text-primary ring-1 ring-primary/10",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
          {[
            { label: "Configuración", icon: Settings, to: "/settings" },
            { label: "Ayuda", icon: CircleHelp, to: "/help" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex min-h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                pathname.startsWith(item.to) &&
                  "bg-primary-soft font-semibold text-primary ring-1 ring-primary/10",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2.5 rounded-md bg-surface-raised/70 p-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              aria-label="Mi perfil"
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {profile?.nombre
                  ?.split(" ")
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() ?? "--"}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    {profile?.nombre ?? "Cargando..."}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {profile?.rol === "medico"
                      ? "Médico"
                      : (profile?.rol ?? "")}
                  </p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                onClick={() => {
                  localStorage.removeItem("arca-med-token");
                  localStorage.removeItem("arca-med-role");

                  void navigate({
                    to: "/login",
                    replace: true,
                  });
                }}
              >
                <LogOut className="size-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 hidden self-end lg:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={
              collapsed ? "Expandir navegación" : "Contraer navegación"
            }
          >
            <ChevronLeft
              className={cn(
                "size-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </Button>
        </div>
      </aside>

      <div
        className={cn(
          "min-w-0 transition-[margin] duration-200 lg:ml-[248px]",
          collapsed && "lg:ml-[76px]",
        )}
      >
        <header className="sticky top-0 z-20 border-b border-border bg-surface-glass backdrop-blur-xl">
          <div className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 lg:px-7">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir navegación"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex min-w-0 items-center gap-4">
              <span className="hidden text-[11px] font-semibold uppercase text-muted-foreground sm:block">
                {title}
              </span>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface-raised/70 px-3 py-2 sm:max-w-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Buscar pacientes, patologías, ejercicios"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                aria-label="Notificaciones"
                className="relative"
              >
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
              </Button>
              <span className="hidden rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary sm:inline">
                {profile?.rol === "medico" ? "Médico" : (profile?.rol ?? "")}
              </span>
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {profile?.nombre
                  ?.split(" ")
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() ?? "--"}
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 lg:px-7 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
