import { Link, createFileRoute, useNavigate } from "@/lib/router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackButton, PageHeader, SuccessPanel } from "@/components/arca/ui-kit";
import { ExerciseForm } from "@/components/arca/exercise-form";
import { exerciseDetailsFor, setExerciseDetails, updateExercise, useMockExercises } from "@/lib/mock-store";

export const Route = createFileRoute("/exercises/$exerciseId/edit")({
  head: () => ({ meta: [
    { title: "Editar ejercicio — ARCA Med" },
    { name: "description", content: "Modifica los parámetros clínicos de un ejercicio." },
    { property: "og:title", content: "Editar ejercicio — ARCA Med" },
    { property: "og:description", content: "Edición de ejercicios de rehabilitación en ARCA Med." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EditExercise,
});

function EditExercise() {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  const id = Number(exerciseId);
  const exercise = useMockExercises().find((e) => e.id === id);
  const [saved, setSaved] = useState(false);
  if (!exercise) return <p className="py-16 text-center text-sm text-muted-foreground">Ejercicio no encontrado.</p>;
  const d = exerciseDetailsFor(id);
  if (saved) return <SuccessPanel title="Cambios guardados" description={`"${exercise.name}" se actualizó correctamente.`}><Button asChild><Link to="/exercises/$exerciseId" params={{ exerciseId }}>Ver ejercicio</Link></Button><Button asChild variant="secondary"><Link to="/exercises">Volver a la biblioteca</Link></Button></SuccessPanel>;
  return <div className="mx-auto max-w-4xl space-y-5">
    <PageHeader back={<BackButton to="/exercises/$exerciseId" params={{ exerciseId }}>Volver al ejercicio</BackButton>} eyebrow="Biblioteca de ejercicios" title="Editar ejercicio" description={exercise.name} />
    <ExerciseForm submitLabel="Guardar cambios" onCancel={() => void navigate({ to: "/exercises/$exerciseId", params: { exerciseId } })}
      initial={{ name: exercise.name, description: exercise.description, objective: exercise.objective, region: exercise.region, muscleGroup: d.muscleGroup, difficulty: exercise.difficulty, sets: d.sets, reps: d.reps, duration: exercise.duration, frequency: d.frequency, instructions: d.instructions, precautions: d.precautions.join("\n"), video: d.video }}
      onSubmit={(v) => {
        updateExercise(id, { name: v.name, region: v.region, description: v.description, difficulty: v.difficulty, objective: v.objective, duration: v.duration, repetitions: `${v.sets} × ${v.reps}` });
        setExerciseDetails(id, { muscleGroup: v.muscleGroup, sets: v.sets, reps: v.reps, frequency: v.frequency, instructions: v.instructions, precautions: v.precautions.split("\n").filter(Boolean), video: v.video });
        setSaved(true);
      }} />
  </div>;
}
