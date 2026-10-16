import preparationImage from "@/assets/knee-evaluation-preparation.jpg";

export const evaluationInstructions = [
  "Colócate frente a la cámara de manera que la articulación sea visible.",
  "Mantén una postura estable durante la evaluación.",
  "Sigue las indicaciones del profesional de salud.",
  "Realiza el movimiento lentamente y sin forzar.",
  "Detén el movimiento si aparece dolor intenso o inestabilidad.",
];

type EvaluationInstructionImageProps = {
  articulation?: string;
};

export function EvaluationInstructionImage({
  articulation,
}: EvaluationInstructionImageProps) {
  const isKnee = articulation?.trim().toLowerCase() === "rodilla";

  if (!isKnee) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-md border border-border bg-muted p-6 text-center">
        <p className="text-sm font-semibold">Preparación de la evaluación</p>
        <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
          El profesional debe indicar la posición y el movimiento
          correspondiente a la articulación seleccionada.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          No hay una imagen específica disponible.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted">
      <img
        src={preparationImage}
        alt="Referencia visual de preparación para evaluación de rodilla"
        width={1200}
        height={900}
        className="aspect-[4/3] w-full object-cover"
      />
    </div>
  );
}
