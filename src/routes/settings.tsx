import { createFileRoute, useNavigate } from "@/lib/router";
import { Lock, Palette, User, RefreshCw, LogOut, PanelLeft, Info, CalendarClock, ListFilter, RotateCcw, ExternalLink, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { PageHeader } from "@/components/arca/ui-kit";
import { getProfile, type UserProfile } from "@/services/profile";
import { getThemePreference, setThemePreference, type ThemePreference } from "@/lib/theme-preference";
import { cn } from "@/lib/utils";
import { useDateStyle, useDensity, setDateStyle, setDensity, type DateStyle, type Density } from "@/lib/display-preferences";
import { getSidebarPreference, setSidebarPreference, type SidebarPreference } from "@/lib/sidebar-preference";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configuración — ARCA Med" }] }),
  component: Settings,
});

const tabs = [
  { id: "cuenta", label: "Cuenta", icon: User },
  { id: "seguridad", label: "Seguridad", icon: Lock },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "sistema", label: "Sistema", icon: Info },
] as const;
type Tab = (typeof tabs)[number]["id"];
const options: { value: ThemePreference; title: string; description: string }[] = [
  { value: "claro", title: "Claro", description: "Utilizar siempre el tema claro" },
  { value: "oscuro", title: "Oscuro", description: "Utilizar siempre el tema oscuro" },
  { value: "sistema", title: "Según el sistema", description: "Seguir la configuración del dispositivo" },
];

function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("cuenta");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference);
  const [sidebar, setSidebar] = useState<SidebarPreference>(getSidebarPreference);
  const dateStyle = useDateStyle();
  const density = useDensity();
  const [checking, setChecking] = useState(false);
  const [connection, setConnection] = useState<"sin-verificar" | "conectado" | "error">("sin-verificar");
  const [connectionInfo, setConnectionInfo] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const version = import.meta.env.VITE_APP_VERSION as string | undefined;
  const environment = import.meta.env.PROD ? "Producción" : "Desarrollo";

  const verifyConnection = async () => {
    setChecking(true);
    setConnectionInfo(null);
    try {
      await getProfile();
      setConnection("conectado");
    } catch {
      setConnection("error");
      setConnectionInfo("No se pudo verificar la conexión autenticada. Comprueba la sesión o la disponibilidad de la API.");
    } finally {
      setChecking(false);
    }
  };

  const resetPreferences = () => {
    setTheme("claro");
    setSidebar("expandido");
    setThemePreference("claro");
    setSidebarPreference("expandido");
    setDateStyle("dd/mm/aaaa");
    setDensity("normal");
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getProfile());
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const logout = () => {
    localStorage.removeItem("arca-med-token");
    localStorage.removeItem("arca-med-role");
    void navigate({ to: "/login", replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Espacio clínico" title="Configuración" description="Consulta tu cuenta, administra tu sesión y personaliza la apariencia." />
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Secciones de configuración" className="flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map((item) => (
            <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)} className={cn("flex min-h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", tab === item.id && "bg-primary-soft font-semibold text-primary")}>
              <item.icon className="size-4" />{item.label}
            </button>
          ))}
        </nav>
        <div>
          {tab === "cuenta" && (
            <Section title="Cuenta" description="Información real obtenida de tu sesión en ARCA Med. Los datos se muestran en modo lectura porque la API no permite editarlos desde aquí.">
              {loading ? <p className="mt-4 text-sm text-muted-foreground">Cargando tu perfil...</p> : error ? (
                <div className="mt-4 space-y-3" role="alert">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button size="sm" variant="secondary" onClick={() => void load()}><RefreshCw className="size-4" /> Reintentar</Button>
                </div>
              ) : (
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border border-border p-4"><dt className="text-xs text-muted-foreground">Nombre</dt><dd className="mt-1 text-sm font-semibold">{profile?.nombre || "No disponible"}</dd></div>
                  <div className="rounded-md border border-border p-4"><dt className="text-xs text-muted-foreground">Rol</dt><dd className="mt-1 text-sm font-semibold">{profile?.rol === "admin" ? "Administrador" : profile?.rol === "medico" ? "Médico" : profile?.rol === "paciente" ? "Paciente" : profile?.rol || "No disponible"}</dd></div>
                </dl>
              )}
              <Button variant="secondary" className="mt-4" onClick={() => void navigate({ to: "/profile" })}>
                <ExternalLink className="size-4" /> Ver mi perfil
              </Button>
            </Section>
          )}
          {tab === "seguridad" && (
            <Section title="Seguridad" description="Controla tu sesión actual.">
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4">
                <div><p className="text-sm font-semibold">Cerrar sesión</p><p className="text-xs text-muted-foreground">Finaliza tu sesión en este navegador. Para cambiar tu contraseña debes contactar a un administrador autorizado.</p></div>
                <Button variant="destructive" onClick={logout}><LogOut className="size-4" /> Cerrar sesión</Button>
              </div>
            </Section>
          )}
          {tab === "apariencia" && (
            <Section title="Apariencia" description="El tema se aplica inmediatamente en la aplicación y se conserva en este navegador.">
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {options.map((option) => (
                  <button key={option.value} type="button" aria-pressed={theme === option.value} onClick={() => { setTheme(option.value); setThemePreference(option.value); }} className={cn("rounded-md border border-border p-4 text-left text-sm font-semibold transition-colors hover:bg-muted", theme === option.value && "border-primary bg-primary-soft text-primary")}>
                    {option.title}<span className="mt-1 block text-xs font-normal text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 space-y-4 rounded-md border border-border p-4">
                <div className="flex items-center gap-2"><PanelLeft className="size-4 text-muted-foreground" /><p className="text-sm font-semibold">Menú lateral al iniciar</p></div>
                <p className="text-xs text-muted-foreground">Define cómo se muestra el menú en pantallas grandes. En móvil se mantiene el menú adaptable.</p>
                <div className="flex flex-wrap gap-2">
                  {(["expandido", "contraido"] as SidebarPreference[]).map((value) => (
                    <Button key={value} variant={sidebar === value ? "primary" : "outline"} aria-pressed={sidebar === value} onClick={() => { setSidebar(value); setSidebarPreference(value); }}>
                      {value === "expandido" ? "Expandido" : "Contraído"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="mt-5 space-y-3 rounded-md border border-border p-4">
                <div className="flex items-center gap-2"><CalendarClock className="size-4 text-muted-foreground" /><p className="text-sm font-semibold">Formato de fecha y hora</p></div>
                <p className="text-xs text-muted-foreground">Cambia las fechas visibles en el portal. Las horas siguen en formato de 24 horas y las fechas que se envían a la API no se modifican.</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Formato de fecha">
                  {(["dd/mm/aaaa", "aaaa-mm-dd"] as DateStyle[]).map((value) => (
                    <Button key={value} type="button" variant={dateStyle === value ? "primary" : "outline"} aria-pressed={dateStyle === value} onClick={() => setDateStyle(value)}>{value}</Button>
                  ))}
                </div>
              </div>
              <div className="mt-5 space-y-3 rounded-md border border-border p-4">
                <div className="flex items-center gap-2"><ListFilter className="size-4 text-muted-foreground" /><p className="text-sm font-semibold">Densidad de la interfaz</p></div>
                <p className="text-xs text-muted-foreground">Reduce el espacio de tarjetas, tablas, formularios y listas sin ocultar información.</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Densidad visual">
                  {(["normal", "compacta"] as Density[]).map((value) => (
                    <Button key={value} type="button" variant={density === value ? "primary" : "outline"} aria-pressed={density === value} onClick={() => setDensity(value)}>{value === "normal" ? "Normal" : "Compacta"}</Button>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4">
                <div><p className="text-sm font-semibold">Restablecer preferencias visuales</p><p className="text-xs text-muted-foreground">Devuelve el tema a Claro, el menú a Expandido, la fecha a dd/mm/aaaa y la densidad a Normal. No afecta tu sesión ni los datos clínicos.</p></div>
                <Button variant="secondary" onClick={resetPreferences}><RotateCcw className="size-4" /> Restablecer</Button>
              </div>
            </Section>
          )}
          {tab === "sistema" && (
            <Section title="Información del sistema" description="Datos del frontend y verificación de conexión a la API con tu sesión actual.">
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-border p-4"><dt className="text-xs text-muted-foreground">Entorno</dt><dd className="mt-1 text-sm font-semibold">{environment}</dd></div>
                <div className="rounded-md border border-border p-4"><dt className="text-xs text-muted-foreground">Versión del frontend</dt><dd className="mt-1 text-sm font-semibold">{version || "No configurada"}</dd></div>
                <div className="rounded-md border border-border p-4 sm:col-span-2"><dt className="text-xs text-muted-foreground">API configurada</dt><dd className="mt-1 break-all text-sm font-semibold">{apiUrl || "No configurada"}</dd></div>
                <div className="rounded-md border border-border p-4 sm:col-span-2"><dt className="text-xs text-muted-foreground">Estado de conexión autenticada</dt><dd className="mt-1 text-sm font-semibold">{connection === "conectado" ? "Conectada" : connection === "error" ? "No se pudo verificar" : "Sin verificar"}</dd></div>
              </dl>
              {connectionInfo && <p className="mt-3 text-sm text-destructive" role="alert">{connectionInfo}</p>}
              <Button className="mt-4" variant="secondary" disabled={checking} onClick={() => void verifyConnection()}>
                {checking ? <RefreshCw className="size-4 animate-spin" /> : <Wifi className="size-4" />}
                {checking ? "Comprobando..." : "Comprobar conexión"}
              </Button>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
