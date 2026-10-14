import { Link, createFileRoute } from "@/lib/router";
import { Filter, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getExercises, type Exercise } from "@/services/exercises";

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [{ title: "Biblioteca de ejercicios — ARCA Med" }],
  }),
  component: ExerciseLibrary,
});

function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadExercises() {
      setLoading(true);
      setError(null);

      try {
        const data = await getExercises();

        if (active) {
          setExercises(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los ejercicios.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadExercises();

    return () => {
      active = false;
    };
  }, []);

  const regions = useMemo(() => {
    return [...new Set(exercises.map((e) => e.articulacion))].sort((a, b) =>
      a.localeCompare(b, "es"),
    );
  }, [exercises]);

  const shown = useMemo(() => {
    const search = query.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesRegion = !region || exercise.articulacion === region;

      const matchesSearch =
        `${exercise.nombre_ejercicio} ${exercise.descripcion ?? ""} ${exercise.articulacion}`
          .toLowerCase()
          .includes(search);

      return matchesRegion && matchesSearch;
    });
  }, [exercises, query, region]);

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
            Revisa los ejercicios de rehabilitación disponibles en ARCA Med.
          </p>
        </div>

        <Button asChild>
          <Link to="/exercises/new">
            <Plus className="size-4" />
            Crear ejercicio
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-card/75 p-4 shadow-clinical sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
          <Search className="size-4 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o articulación"
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
            <option value="">Todas las regiones</option>

            {regions.map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          Mostrando {shown.length} de {exercises.length} ejercicios
        </p>
      )}

      {loading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando ejercicios...
        </p>
      )}

      {error && (
        <p role="alert" className="py-12 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((exercise) => (
            <article
              key={exercise.id}
              className="flex flex-col rounded-lg border border-border bg-card/75 p-5 shadow-clinical backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-accent">
                    {exercise.articulacion}
                  </span>

                  <h2 className="mt-1 text-base font-semibold">
                    {exercise.nombre_ejercicio}
                  </h2>
                </div>
              </div>

              <p className="mt-3 line-clamp-5 flex-1 whitespace-pre-line text-sm leading-5 text-muted-foreground">
                {exercise.descripcion || "Sin descripción disponible."}
              </p>

              <div className="mt-4 rounded-md bg-muted p-2">
                <p className="text-xs text-muted-foreground">Identificador</p>

                <p className="mt-0.5 text-sm font-semibold">#{exercise.id}</p>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <Button asChild size="sm" className="flex-1">
                  <Link
                    to="/exercises/$exerciseId"
                    params={{
                      exerciseId: String(exercise.id),
                    }}
                  >
                    Revisar
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && shown.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Ningún ejercicio coincide con estos filtros.
        </p>
      )}
    </div>
  );
}
