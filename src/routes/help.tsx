import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, ChevronDown, CircleHelp, Info, Search, ShieldCheck } from "lucide-react";
import { Link, createFileRoute } from "@/lib/router";
import { getProfile } from "@/services/profile";
import { normalizeSearch } from "@/lib/search-normalization";
import { Section } from "@/components/arca/clinical";
import { PageHeader } from "@/components/arca/ui-kit";
import { cn } from "@/lib/utils";

type HelpRole = "admin" | "medico" | "paciente";
type Faq = { id: string; category: string; question: string; answer: string; roles: HelpRole[]; link?: { to: string; label: string } };
type HelpLink = { to: string; title: string; description: string; roles: HelpRole[] };

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Ayuda — ARCA Med" }, { name: "description", content: "Ayuda actualizada del portal ARCA Med." }] }),
  component: Help,
});

// Instrucciones basadas en funciones existentes. Evitar prometer un trámite si no hay API.
const faqs: Faq[] = [
  { id: "account", category: "Cuenta", question: "¿Dónde puedo ver la información de mi cuenta?", answer: "Abre Mi perfil para consultar tus datos. En Configuración puedes cambiar la apariencia y cerrar sesión. El portal no permite cambiar la contraseña desde esta pantalla.", roles: ["admin", "medico"], link: { to: "/settings", label: "Abrir Configuración" } },
  { id: "appearance", category: "Configuración", question: "¿Cómo cambio el tema, el formato de fecha o el tamaño de la interfaz?", answer: "Ve a Configuración, sección Apariencia. Puedes elegir tema claro u oscuro, formato de fecha, menú lateral e interfaz normal o compacta. Las preferencias visuales se conservan en este navegador.", roles: ["admin", "medico"], link: { to: "/settings", label: "Personalizar apariencia" } },
  { id: "privacy", category: "Seguridad", question: "¿Cómo cierro mi sesión?", answer: "Usa Cerrar sesión desde el menú de la cuenta o desde Configuración. No compartas tus credenciales ni capturas que incluyan tokens de autenticación.", roles: ["admin", "medico"], link: { to: "/settings", label: "Abrir Seguridad" } },
  { id: "admin-patients", category: "Pacientes", question: "¿Cómo creo o edito un paciente?", answer: "Con una cuenta administrativa, abre Pacientes. Utiliza Nuevo paciente para registrar uno, o Editar en el listado para modificar los datos permitidos. La edición se realiza en una ventana emergente.", roles: ["admin"], link: { to: "/patients", label: "Ir a Pacientes" } },
  { id: "admin-users", category: "Usuarios", question: "¿Dónde se administran las cuentas?", answer: "La administración de usuarios está disponible desde Usuarios para las cuentas administrativas. Los permisos dependen del rol registrado en el servidor.", roles: ["admin"], link: { to: "/admin/usuarios", label: "Ir a Usuarios" } },
  { id: "admin-appointments", category: "Citas", question: "¿Cómo creo, cambio o cancelo una cita?", answer: "Abre Citas desde el menú administrativo. Selecciona el médico, el paciente y una fecha en el calendario. Elige un horario disponible dentro de la jornada configurada; el servidor confirma que la reserva sea válida.", roles: ["admin"], link: { to: "/admin/citas", label: "Gestionar citas" } },
  { id: "audit", category: "Auditoría", question: "¿Dónde consulto los registros de auditoría?", answer: "La pestaña Auditoría está disponible para el administrador. Es distinta del Historial clínico del médico y muestra los eventos registrados por el sistema.", roles: ["admin"], link: { to: "/auditoria", label: "Ver Auditoría" } },
  { id: "exercises", category: "Ejercicios", question: "¿Dónde se consulta la biblioteca de ejercicios?", answer: "Las cuentas administrativas pueden abrir Ejercicios para consultar la biblioteca. La edición persistente de ejercicios y su asignación a pacientes dependen de funcionalidades adicionales del backend.", roles: ["admin"], link: { to: "/exercises", label: "Abrir Ejercicios" } },
  { id: "doctor-patients", category: "Pacientes", question: "¿Cómo consulto una ficha clínica?", answer: "Abre Pacientes y selecciona el nombre o el botón Ver ficha. Los datos clínicos solo aparecerán si hay registros reales para ese paciente.", roles: ["medico"], link: { to: "/patients", label: "Ver directorio" } },
  { id: "triage", category: "Triaje", question: "¿Dónde veo los casos pendientes de Triaje?", answer: "Abre Triaje. Si no hay pacientes pendientes, la pantalla lo indicará. La clasificación es una prioridad sugerida y requiere valoración del profesional.", roles: ["medico"], link: { to: "/triage", label: "Abrir Triaje" } },
  { id: "doctor-appointments", category: "Citas", question: "¿Dónde consulto mis citas médicas?", answer: "Abre Mi agenda o utiliza el calendario del Dashboard. Allí puedes consultar tus citas. La creación de citas por el médico requiere permisos habilitados en el backend.", roles: ["medico"], link: { to: "/agenda", label: "Abrir Mi agenda" } },
  { id: "history", category: "Historial", question: "¿Qué muestra la pestaña Historial?", answer: "Muestra las citas reales asociadas al médico y, al seleccionar un paciente, sus síntomas y exámenes disponibles. No es un registro completo de cada modificación ni sustituye la Auditoría administrativa.", roles: ["medico"], link: { to: "/history", label: "Abrir Historial" } },
  { id: "movement", category: "Evaluaciones", question: "¿Dónde se realizan las evaluaciones articulares?", answer: "La evaluación del movimiento mediante cámara corresponde a la aplicación móvil. La pestaña de evaluación por cámara se retiró del portal web.", roles: ["medico", "admin"] },
  { id: "guides", category: "Guías clínicas", question: "¿Cómo consulto las guías clínicas?", answer: "Abre Guías clínicas y selecciona una guía. El administrador puede crear nuevas guías; el médico tiene acceso de lectura.", roles: ["medico", "admin"], link: { to: "/guias-clinicas", label: "Abrir Guías clínicas" } },
];

const quickLinks: HelpLink[] = [
  { to: "/admin/inicio", title: "Panel administrativo", description: "Accesos a las funciones administrativas.", roles: ["admin"] },
  { to: "/admin/citas", title: "Gestión de citas", description: "Crear, consultar y administrar citas.", roles: ["admin"] },
  { to: "/admin/usuarios", title: "Usuarios", description: "Consultar y gestionar cuentas.", roles: ["admin"] },
  { to: "/", title: "Dashboard médico", description: "Resumen de actividad y pendientes.", roles: ["medico"] },
  { to: "/patients", title: "Pacientes", description: "Consultar el directorio permitido.", roles: ["medico"] },
  { to: "/agenda", title: "Mi agenda", description: "Consultar las citas del médico.", roles: ["medico"] },
  { to: "/guias-clinicas", title: "Guías clínicas", description: "Consultar información clínica disponible.", roles: ["admin", "medico"] },
  { to: "/settings", title: "Configuración", description: "Ajustar preferencias y gestionar la sesión.", roles: ["admin", "medico"] },
];

function Help() {
  const [role, setRole] = useState<HelpRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getProfile().then((profile) => {
      if (!active) return;
      if (profile.rol === "admin" || profile.rol === "medico" || profile.rol === "paciente") {
        setRole(profile.rol);
      } else {
        setError("Tu perfil no tiene una sección de ayuda disponible.");
      }
    }).catch(() => {
      if (active) setError("No fue posible consultar tu perfil. Vuelve a intentar al recuperar la conexión.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleFaqs = useMemo(() => faqs.filter(item =>
    role && item.roles.includes(role) && normalizeSearch(`${item.category} ${item.question} ${item.answer}`).includes(normalizeSearch(query)),
  ), [role, query]);
  const visibleLinks = useMemo(() => quickLinks.filter(item => role && item.roles.includes(role)), [role]);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Centro de ayuda" title="Ayuda" description="Respuestas y accesos a funciones disponibles en ARCA Med." />
      {loading ? <section className="rounded-md border border-border bg-surface-raised p-5 text-sm text-muted-foreground">Cargando ayuda para tu perfil...</section> : error ?
        <div role="alert" className="rounded-md border border-destructive/30 bg-surface-raised p-4 text-sm text-destructive">{error}</div> :
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Section title="Preguntas frecuentes">
            <label className="mt-3 flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-primary/25">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">Buscar preguntas frecuentes</span>
              <input className="w-full min-w-0 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar una pregunta..." type="search" />
            </label>
            <div className="mt-3 divide-y divide-border">
              {visibleFaqs.map(item => {
                const isOpen = openId === item.id;
                return <div key={item.id}>
                  <button type="button" aria-expanded={isOpen} aria-controls={`help-answer-${item.id}`} onClick={() => setOpenId(isOpen ? null : item.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <span><span className="block text-[11px] font-semibold uppercase text-accent">{item.category}</span><span className="mt-0.5 block text-sm font-semibold">{item.question}</span></span>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && <div id={`help-answer-${item.id}`} className="space-y-2 pb-4">
                    <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>
                    {item.link && <Link to={item.link.to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{item.link.label}<ArrowUpRight className="size-4" /></Link>}
                  </div>}
                </div>;
              })}
              {visibleFaqs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No hay preguntas que coincidan con tu búsqueda.</p>}
            </div>
          </Section>
          <div className="space-y-5">
            <Section title="Accesos útiles">
              <div className="mt-3 space-y-2">
                {visibleLinks.map(item => <Link key={item.to} to={item.to} className="flex items-start gap-3 rounded-md border border-border bg-background p-3 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span></span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>)}
              </div>
            </Section>
            <Section title="Sobre esta ayuda">
              <div className="mt-3 flex items-start gap-3 rounded-md border border-border bg-background p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">Esta página explica funciones disponibles del portal. Para reportar un error, comunícalo por el canal de soporte establecido por tu equipo. ARCA Med no envía solicitudes de soporte desde esta pantalla.</p>
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" /><span>Evita compartir contraseñas, tokens y datos clínicos sensibles en reportes o capturas.</span></div>
            </Section>
          </div>
        </div>}
      {!loading && !error && <p className="flex items-center gap-2 text-xs text-muted-foreground"><CircleHelp className="size-4" />Ayuda adaptada al perfil {role === "admin" ? "administrativo" : role === "medico" ? "médico" : "paciente"}.</p>}
    </div>
  );
}
