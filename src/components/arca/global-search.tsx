import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  BookOpen,
  BookMarked,
  CalendarDays,
  ClipboardList,
  Search,
  Users,
} from "lucide-react";
import { useNavigate } from "@/lib/router";
import { getMedicalPatients, getRegisteredPatients } from "@/services/patients";
import { getExercises } from "@/services/exercises";
import { listClinicalGuides } from "@/services/clinical-guides";
import { cn } from "@/lib/utils";

type Role = string;
type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  kind: "page" | "patient" | "exercise" | "guide";
};
const pages = {
  medico: [
    { title: "Panel principal", to: "/" },
    { title: "Pacientes", to: "/patients" },
    { title: "Triaje", to: "/triage" },
    { title: "Historial", to: "/history" },
    { title: "Mi agenda", to: "/agenda" },
    { title: "Guías clínicas", to: "/guias-clinicas" },
  ],
  admin: [
    { title: "Inicio", to: "/admin/inicio" },
    { title: "Pacientes", to: "/patients" },
    { title: "Usuarios", to: "/admin/usuarios" },
    { title: "Citas", to: "/admin/citas" },
    { title: "Ejercicios", to: "/exercises" },
    { title: "Auditoría", to: "/auditoria" },
    { title: "Guías clínicas", to: "/guias-clinicas" },
  ],
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export function GlobalSearch({ role }: { role: Role | undefined }) {
  const navigate = useNavigate();
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(0);
  const effectiveRole =
    role === "medico"
      ? "medico"
      : role === "admin" || role === "soporte"
        ? "admin"
        : null;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const term = normalize(query.trim());
    if (!term || !effectiveRole) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }
    setLoading(true);
    setError(false);
    const timer = window.setTimeout(async () => {
      const staticResults: SearchResult[] = [
        ...pages[effectiveRole].map((p) => ({
          id: `page:${p.to}`,
          title: p.title,
          subtitle: "Ir a sección",
          to: p.to,
          kind: "page" as const,
        })),
        {
          id: "page:/profile",
          title: "Mi perfil",
          subtitle: "Ir a sección",
          to: "/profile",
          kind: "page" as const,
        },
        {
          id: "page:/settings",
          title: "Configuración",
          subtitle: "Ir a sección",
          to: "/settings",
          kind: "page" as const,
        },
        {
          id: "page:/help",
          title: "Ayuda",
          subtitle: "Ir a sección",
          to: "/help",
          kind: "page" as const,
        },
      ].filter((item) => normalize(item.title).includes(term));

      const requests = [
        effectiveRole === "medico"
          ? getMedicalPatients()
          : getRegisteredPatients(),
        listClinicalGuides(),
        ...(effectiveRole === "admin" ? [getExercises()] : []),
      ];
      const data = await Promise.allSettled(requests);
      if (cancelled) return;
      const dynamic: SearchResult[] = [];
      const patientsResult = data[0];
      if (patientsResult.status === "fulfilled") {
        for (const patient of patientsResult.value as Awaited<
          ReturnType<typeof getMedicalPatients>
        >) {
          if (normalize(`${patient.nombre} ${patient.email}`).includes(term)) {
            dynamic.push({
              id: `patient:${patient.id}`,
              title: patient.nombre,
              subtitle: `Paciente · ${patient.email}`,
              to:
                effectiveRole === "medico"
                  ? `/patients/${patient.id}`
                  : "/patients",
              kind: "patient",
            });
          }
        }
      }
      const guidesResult = data[1];
      if (guidesResult.status === "fulfilled") {
        for (const guide of guidesResult.value as Awaited<
          ReturnType<typeof listClinicalGuides>
        >) {
          if (normalize(`${guide.titulo} ${guide.contenido}`).includes(term)) {
            dynamic.push({
              id: `guide:${guide.id}`,
              title: guide.titulo,
              subtitle: "Guía clínica",
              to: "/guias-clinicas",
              kind: "guide",
            });
          }
        }
      }
      const exercisesResult = data[2];
      if (exercisesResult?.status === "fulfilled") {
        for (const exercise of exercisesResult.value as Awaited<
          ReturnType<typeof getExercises>
        >) {
          if (
            normalize(
              `${exercise.nombre_ejercicio} ${exercise.articulacion} ${exercise.descripcion ?? ""}`,
            ).includes(term)
          ) {
            dynamic.push({
              id: `exercise:${exercise.id}`,
              title: exercise.nombre_ejercicio,
              subtitle: `Ejercicio · ${exercise.articulacion}`,
              to: `/exercises/${exercise.id}`,
              kind: "exercise",
            });
          }
        }
      }
      setError(data.some((result) => result.status === "rejected"));
      setResults([...staticResults, ...dynamic].slice(0, 15));
      setSelected(0);
      setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, effectiveRole]);

  function go(item: SearchResult) {
    setOpen(false);
    setQuery("");
    navigate({ to: item.to });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      input.current?.blur();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((n) => Math.min(n + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((n) => Math.max(0, n - 1));
    } else if (event.key === "Enter" && results.length) {
      event.preventDefault();
      go(results[selected] ?? results[0]);
    }
  }

  if (!effectiveRole) return null;

  return (
    <div ref={wrapper} className="relative w-full min-w-0 flex-1 sm:max-w-sm">
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface-raised/70 px-3 py-2">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={input}
          type="search"
          aria-label="Buscar en ARCA Med"
          aria-expanded={open && query.trim().length > 0}
          aria-controls="arca-global-search-results"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Buscar en ARCA Med"
        />
      </div>
      {open && query.trim() && (
        <div
          id="arca-global-search-results"
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60dvh] min-w-0 overflow-y-auto overscroll-contain rounded-lg border border-border bg-background p-1 shadow-xl sm:min-w-[320px]"
        >
          {loading ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Buscando…</p>
          ) : results.length ? (
            <>
              {results.map((item, index) => {
                const Icon =
                  item.kind === "patient"
                    ? Users
                    : item.kind === "exercise"
                      ? BookOpen
                      : item.kind === "guide"
                        ? BookMarked
                        : item.to.includes("cita") || item.to === "/agenda"
                          ? CalendarDays
                          : ClipboardList;
                return (
                  <button
                    type="button"
                    key={item.id}
                    role="option"
                    aria-selected={index === selected}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => go(item)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-muted",
                      index === selected && "bg-muted",
                    )}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No se encontraron resultados.
            </p>
          )}
          {error && !loading && (
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              Algunos resultados no se pudieron consultar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
