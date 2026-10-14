import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import {
  BackButton,
  PageHeader,
  SuccessPanel,
  Field,
  TextInput,
  TextArea,
  SelectInput,
} from "@/components/arca/ui-kit";
import { createExercise } from "@/services/exercises";

export const Route = createFileRoute("/exercises/new")({
  head: () => ({
    meta: [{ title: "Crear ejercicio — ARCA Med" }],
  }),
  component: NewExercise,
});

const articulaciones = [
  "rodilla",
  "tobillo",
  "hombro",
  "codo",
  "muneca",
  "cadera",
  "cervical",
  "lumbar",
];

function NewExercise() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [articulacion, setArticulacion] = useState("rodilla");
  const [posicion, setPosicion] = useState("");
  const [ejecucion, setEjecucion] = useState("");
  const [dosificacion, setDosificacion] = useState("");
  const [precauciones, setPrecauciones] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError(null);

    const descripcion = [
      `Posición inicial: ${posicion.trim()}`,
      `Ejecución: ${ejecucion.trim()}`,
      `Dosificación: ${dosificacion.trim()}`,
      precauciones.trim() ? `Precaución: ${precauciones.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await createExercise({
        nombre_ejercicio: name.trim(),
        articulacion,
        descripcion,
      });

      setCreatedId(result.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el ejercicio.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (createdId !== null) {
    return (
      <SuccessPanel
        title="Ejercicio creado"
        description="El ejercicio se guardó correctamente mediante FastAPI."
      >
        <Button asChild>
          <Link
            to="/exercises/$exerciseId"
            params={{ exerciseId: String(createdId) }}
          >
            Ver ejercicio
          </Link>
        </Button>

        <Button asChild variant="secondary">
          <Link to="/exercises">Volver a la biblioteca</Link>
        </Button>
      </SuccessPanel>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        back={<BackButton to="/exercises">Volver a la biblioteca</BackButton>}
        eyebrow="Biblioteca de ejercicios"
        title="Crear ejercicio"
        description="Registra un ejercicio clínico en ARCA Med."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Información básica">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del ejercicio" className="sm:col-span-2">
              <TextInput
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Articulación">
              <SelectInput
                options={articulaciones}
                value={articulacion}
                onChange={(e) => setArticulacion(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Instrucciones clínicas"
          description="Estos campos se guardarán en la descripción del ejercicio."
        >
          <div className="mt-4 space-y-4">
            <Field label="Posición inicial">
              <TextArea
                required
                value={posicion}
                onChange={(e) => setPosicion(e.target.value)}
                placeholder="Describe cómo debe posicionarse el paciente."
              />
            </Field>

            <Field label="Ejecución">
              <TextArea
                required
                value={ejecucion}
                onChange={(e) => setEjecucion(e.target.value)}
                placeholder="Explica cómo realizar el movimiento."
              />
            </Field>

            <Field label="Dosificación">
              <TextInput
                required
                value={dosificacion}
                onChange={(e) => setDosificacion(e.target.value)}
                placeholder="Ejemplo: 3 series de 10 repeticiones."
              />
            </Field>

            <Field label="Precauciones">
              <TextArea
                value={precauciones}
                onChange={(e) => setPrecauciones(e.target.value)}
                placeholder="Indica las precauciones del ejercicio."
              />
            </Field>
          </div>
        </Section>

        <Section title="Contenido multimedia">
          <p className="mt-4 text-sm text-muted-foreground">
            La subida de videos no está disponible en la API actual. Las
            imágenes se podrán incorporar posteriormente mediante el endpoint de
            imágenes.
          </p>
        </Section>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => void navigate({ to: "/exercises" })}
          >
            Cancelar
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear ejercicio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
