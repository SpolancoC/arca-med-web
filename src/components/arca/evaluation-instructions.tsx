import preparationImage from "@/assets/knee-evaluation-preparation.jpg";

export const evaluationInstructions = [
  "Colócate de perfil frente a la cámara.",
  "Mantén la articulación visible durante toda la evaluación.",
  "Sigue el movimiento indicado en pantalla.",
  "Procura mantener una postura estable.",
  "Realiza el movimiento lentamente y sin forzar.",
];

export function EvaluationInstructionImage() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted">
      <img
        src={preparationImage}
        alt="Paciente de perfil realizando flexión de rodilla frente a una cámara"
        width={1200}
        height={900}
        className="aspect-[4/3] w-full object-cover"
      />
    </div>
  );
}
