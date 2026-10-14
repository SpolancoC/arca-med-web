import { useEffect, useState, type ChangeEvent } from "react";

import { Link, createFileRoute } from "@/lib/router";
import { AlertTriangle, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, PageHeader } from "@/components/arca/ui-kit";

import {
  getExercises,
  uploadExerciseImage,
  type Exercise,
} from "@/services/exercises";

export const Route = createFileRoute("/exercises/$exerciseId/")({
  head: () => ({
    meta: [
      { title: "Revisar ejercicio — ARCA Med" },
      {
        name: "description",
        content: "Detalle clínico de un ejercicio de rehabilitación.",
      },
    ],
  }),
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { exerciseId } = Route.useParams();
  const id = Number(exerciseId);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadExercise() {
      setLoading(true);
      setError(null);
      setExercise(null);
      setUploadError(null);
      setUploadSuccess(false);

      try {
        const exercises = await getExercises();

        const selected = exercises.find((item) => item.id === id);

        if (active) {
          setExercise(selected ?? null);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el ejercicio.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadExercise();

    return () => {
      active = false;
    };
  }, [id]);

  // Esta función está FUERA de useEffect.
  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || !exercise || uploading) return;

    setUploadError(null);
    setUploadSuccess(false);

    if (!file.type.startsWith("image/")) {
      setUploadError("Selecciona un archivo de imagen válido.");
      input.value = "";
      return;
    }

    setUploading(true);

    try {
      const updatedExercise = await uploadExerciseImage(exercise.id, file);

      setExercise(updatedExercise);
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "No se pudo subir la imagen.",
      );
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Cargando información del ejercicio...
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {error || "Ejercicio no encontrado."}
        </p>

        <Button asChild variant="secondary" className="mt-4">
          <Link to="/exercises">Volver a la biblioteca</Link>
        </Button>
      </div>
    );
  }

  const sections =
    exercise.descripcion
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

  const instructions = sections.filter(
    (line) => !line.toLowerCase().startsWith("precaución:"),
  );

  const precautions = sections
    .filter((line) => line.toLowerCase().startsWith("precaución:"))
    .map((line) => line.replace(/^precaución:\s*/i, ""));

  const info = [
    ["ID del ejercicio", String(exercise.id)],
    ["Articulación", exercise.articulacion],
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        back={<BackButton to="/exercises">Volver a la biblioteca</BackButton>}
        eyebrow="Revisar ejercicio"
        title={exercise.nombre_ejercicio}
        description={`Ejercicio de rehabilitación para ${exercise.articulacion}.`}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Section
          title="Imagen del ejercicio"
          description="Referencia visual de la ejecución."
        >
          <div className="mt-4 grid aspect-video place-items-center overflow-hidden rounded-md border border-border bg-muted">
            {exercise.imagen_url ? (
              <img
                src={
                  exercise.imagen_url.startsWith("http")
                    ? exercise.imagen_url
                    : `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}${exercise.imagen_url}`
                }
                alt={exercise.nombre_ejercicio}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageOff className="size-10" />

                <p className="text-sm">Imagen no disponible</p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                {exercise.imagen_url ? "Reemplazar imagen" : "Agregar imagen"}
              </span>

              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleImageUpload}
                className="block w-full rounded-md border border-border bg-card p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-primary"
              />
            </label>

            {uploading && (
              <p className="text-sm text-muted-foreground">
                Subiendo imagen...
              </p>
            )}

            {uploadSuccess && (
              <p role="status" className="text-sm text-green-600">
                Imagen subida correctamente.
              </p>
            )}

            {uploadError && (
              <p role="alert" className="text-sm text-destructive">
                {uploadError}
              </p>
            )}
          </div>
        </Section>

        <Section title="Información del ejercicio">
          <dl className="mt-4 grid grid-cols-2 gap-2">
            {info.map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted p-2.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>

                <dd className="mt-0.5 text-sm font-semibold capitalize">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Instrucciones">
          {instructions.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {instructions.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {index + 1}
                  </span>

                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay instrucciones disponibles.
            </p>
          )}
        </Section>

        <Section
          title="Consideraciones clínicas"
          description="Recomendaciones y precauciones para el profesional."
        >
          {precautions.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {precautions.map((precaution, index) => (
                <li key={index} className="flex gap-2.5 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-priority-high-foreground" />

                  <span className="leading-relaxed">{precaution}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay precauciones registradas.
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}
