import { normalizeSearch } from "@/lib/search-normalization";
import { createFileRoute } from "@/lib/router";
import { BookOpen, Bug, ChevronDown, Headset, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { Section } from "@/components/arca/clinical";
import { PageHeader, SearchBox } from "@/components/arca/ui-kit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Ayuda — ARCA Med" },
    { name: "description", content: "Centro de ayuda, preguntas frecuentes, guías y contacto con soporte de ARCA Med." },
    { property: "og:title", content: "Ayuda — ARCA Med" },
    { property: "og:description", content: "Resuelve tus dudas sobre ARCA Med." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Help,
});

const faqs = [
  { cat: "Pacientes", q: "¿Cómo registro un nuevo paciente?", a: "Ve a Pacientes y presiona “Nuevo paciente”. Completa los datos obligatorios y guarda la ficha." },
  { cat: "Evaluaciones", q: "¿Cómo inicio una nueva evaluación?", a: "Desde la ficha del paciente presiona “Nueva evaluación”, revisa las instrucciones y continúa a la cámara." },
  { cat: "Cámara", q: "¿Qué hago si la cámara no se activa?", a: "Verifica que el navegador tenga permiso para usar la cámara y que ninguna otra aplicación la esté utilizando." },
  { cat: "Ejercicios", q: "¿Puedo editar un ejercicio de la biblioteca?", a: "Sí. Abre el ejercicio, presiona “Editar ejercicio”, realiza los cambios y guarda." },
  { cat: "Resultados", q: "¿Cómo comparo una evaluación con las anteriores?", a: "En la vista de resultados encontrarás la comparación con la medición previa y el gráfico de evolución." },
  { cat: "Configuración", q: "¿Cómo cambio mi contraseña?", a: "En Configuración → Seguridad presiona “Cambiar contraseña”." },
];
const guides = ["Cómo crear un paciente", "Cómo realizar una evaluación", "Cómo revisar resultados", "Cómo asignar ejercicios"];
const contact = [{ icon: Headset, label: "Contactar soporte", text: "Lunes a viernes, 08:00 – 18:00" }, { icon: Bug, label: "Reportar un problema", text: "Describe el error que encontraste" }, { icon: MessageSquare, label: "Enviar comentarios", text: "Ayúdanos a mejorar ARCA Med" }];

function Help() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const shown = faqs.filter((f) => normalizeSearch(`${f.cat} ${f.q} ${f.a}`).includes(normalizeSearch(query)));
  return <div className="space-y-5">
    <PageHeader eyebrow="Centro de ayuda" title="Ayuda" description="Encuentra respuestas, guías y formas de contacto." />
    <SearchBox value={query} onChange={setQuery} placeholder="¿En qué podemos ayudarte?" className="max-w-xl py-3" />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Section title="Preguntas frecuentes"><div className="mt-3 divide-y divide-border">{shown.map((f) => { const i = faqs.indexOf(f); const isOpen = open === i; return <div key={f.q}><button aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 py-3 text-left"><span><span className="text-[11px] font-semibold uppercase text-accent">{f.cat}</span><span className="block text-sm font-semibold">{f.q}</span></span><ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} /></button>{isOpen && <p className="pb-3 text-sm text-muted-foreground">{f.a}</p>}</div>; })}{shown.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No encontramos resultados para tu búsqueda.</p>}</div></Section>
      <div className="space-y-5">
        <Section title="Guías"><ul className="mt-3 space-y-2">{guides.map((g) => <li key={g}><button onClick={() => toast(g, { description: "La guía se abrirá en una próxima versión." })} className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left text-sm font-medium hover:bg-muted"><BookOpen className="size-4 text-primary" />{g}</button></li>)}</ul></Section>
        <Section title="Contacto"><ul className="mt-3 space-y-2">{contact.map((c) => <li key={c.label}><button onClick={() => toast.success(c.label, { description: "Solicitud registrada. Te contactaremos pronto." })} className="flex w-full items-center gap-3 rounded-md border border-border p-3 text-left hover:bg-muted"><span className="grid size-8 place-items-center rounded-md bg-accent-soft text-accent"><c.icon className="size-4" /></span><span><span className="block text-sm font-semibold">{c.label}</span><span className="text-xs text-muted-foreground">{c.text}</span></span></button></li>)}</ul></Section>
      </div>
    </div>
  </div>;
}
