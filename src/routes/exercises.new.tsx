import { Link, createFileRoute, useNavigate } from "@/lib/router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackButton, PageHeader, SuccessPanel } from "@/components/arca/ui-kit";
import { ExerciseForm } from "@/components/arca/exercise-form";
import { addExercise, setExerciseDetails } from "@/lib/mock-store";

export const Route = createFileRoute("/exercises/new")({
  head: () => ({ meta: [
    { title: "Crear ejercicio — ARCA Med" },
    { name: "description", content: "Agrega un nuevo ejercicio de rehabilitación con video de referencia." },
    { property: "og:title", content: "Crear ejercicio — ARCA Med" },
    { property: "og:description", content: "Formulario para crear ejercicios clínicos en ARCA Med." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: NewExercise,
});

function NewExercise() {
  const navigate = useNavigate();
  const [createdId, setCreatedId] = useState<number | null>(null);
  if (createdId) return <SuccessPanel title="Ejercicio creado" description="El ejercicio se agregó a la biblioteca y quedó disponible para revisión clínica."><Button asChild><Link to="/exercises/$exerciseId" params={{ exerciseId: String(createdId) }}>Ver ejercicio</Link></Button><Button asChild variant="secondary"><Link to="/exercises">Volver a la biblioteca</Link></Button></SuccessPanel>;
  return <div className="mx-auto max-w-4xl space-y-5">
    <PageHeader back={<BackButton to="/exercises">Volver a la biblioteca</BackButton>} eyebrow="Biblioteca de ejercicios" title="Crear ejercicio" description="Define los parámetros clínicos, las instrucciones y el video de referencia." />
    <ExerciseForm submitLabel="Crear ejercicio" onCancel={() => void navigate({ to: "/exercises" })}
      initial={{ name: "", description: "", objective: "Movilidad", region: "Rodilla", muscleGroup: "", difficulty: "Inicial", sets: 3, reps: 10, duration: "8 min", frequency: "3 días por semana", instructions: [""], precautions: "" }}
      onSubmit={(v) => {
        const id = addExercise({ name: v.name, region: v.region, description: v.description, difficulty: v.difficulty, objective: v.objective, duration: v.duration, repetitions: `${v.sets} × ${v.reps}`, status: "Revisión clínica" });
        setExerciseDetails(id, { muscleGroup: v.muscleGroup, sets: v.sets, reps: v.reps, frequency: v.frequency, instructions: v.instructions, precautions: v.precautions.split("\n").filter(Boolean), video: v.video });
        setCreatedId(id);
      }} />
  </div>;
}
