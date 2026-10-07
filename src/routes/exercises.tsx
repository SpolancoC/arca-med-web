import { Link, createFileRoute } from "@/lib/router";
import { Clock, Filter, Plus, Repeat2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { exercises } from "@/lib/arca-data";

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [
      { title: "Biblioteca de ejercicios — ARCA Med" },
      {
        name: "description",
        content:
          "Busca y gestiona ejercicios de rehabilitación basados en evidencia.",
      },
      { property: "og:title", content: "Biblioteca de ejercicios — ARCA Med" },
      {
        property: "og:description",
        content: "Catálogo clínico de ejercicios de rehabilitación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExerciseLibrary,
});
function ExerciseLibrary() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("Todas las regiones");
  const shown = useMemo(
    () =>
      exercises.filter(
        (exercise) =>
          (region === "Todas las regiones" || exercise.region === region) &&
          `${exercise.name} ${exercise.description} ${exercise.objective}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, region],
  );
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">
            Recursos de rehabilitación
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Biblioteca de ejercicios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisa, adapta y prescribe programas de movimiento clínicamente
            apropiados.
          </p>
        </div>
        <Button asChild>
          <Link to="/exercises/new">
            <Plus className="size-4" />
            Crear ejercicio
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 rounded-lg border border-border bg-card/75 p-4 shadow-clinical sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, objetivo o región"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <label className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm">
          <Filter className="size-4 text-muted-foreground" />
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="bg-transparent outline-none"
          >
            <option>Todas las regiones</option>
            <option>Rodilla</option>
            <option>Hombro</option>
            <option>Columna lumbar</option>
            <option>Cadera</option>
          </select>
        </label>
        <select
          aria-label="Categoría"
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm"
        >
          <option>Todos los objetivos</option>
          <option>Movilidad</option>
          <option>Fuerza</option>
          <option>Control motor</option>
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((exercise) => (
          <article
            key={exercise.id}
            className="flex flex-col rounded-lg border border-border bg-card/75 p-5 shadow-clinical backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase text-accent">
                  {exercise.region}
                </span>
                <h2 className="mt-1 text-base font-semibold">
                  {exercise.name}
                </h2>
              </div>
              <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-semibold text-primary">
                {exercise.status}
              </span>
            </div>
            <p className="mt-3 min-h-10 text-sm leading-5 text-muted-foreground">
              {exercise.description}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-muted p-2">
                <p className="text-muted-foreground">Dificultad</p>
                <p className="mt-0.5 font-semibold">{exercise.difficulty}</p>
              </div>
              <div className="rounded-md bg-muted p-2">
                <p className="text-muted-foreground">Objetivo</p>
                <p className="mt-0.5 font-semibold">{exercise.objective}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {exercise.duration}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="size-3.5" />
                {exercise.repetitions}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" className="flex-1">
                <Link to="/exercises/$exerciseId" params={{ exerciseId: String(exercise.id) }}>Revisar</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/exercises/$exerciseId/edit" params={{ exerciseId: String(exercise.id) }}>Editar</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Ningún ejercicio coincide con estos filtros.
        </p>
      )}
    </div>
  );
}
