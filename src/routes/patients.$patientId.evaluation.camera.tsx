import { Link, createFileRoute } from "@/lib/router";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/patients/$patientId/evaluation/camera")({
  head: () => ({
    meta: [
      {
        title: "Cámara de evaluación — ARCA Med",
      },
      {
        name: "description",
        content:
          "Vista previa de cámara para evaluación de movimiento articular.",
      },
    ],
  }),
  component: EvaluationCamera,
});

function EvaluationCamera() {
  const { patientId } = Route.useParams();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [articulation, setArticulation] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recuperar la articulación seleccionada.
  useEffect(() => {
    const savedArticulation = sessionStorage.getItem(
      `arca-evaluation-articulation-${patientId}`,
    );

    setArticulation(savedArticulation ?? "");
  }, [patientId]);

  // Detener los dispositivos al abandonar la pantalla.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    };
  }, []);

  async function startCamera() {
    if (cameraLoading || streamRef.current) return;

    setCameraLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Tu navegador no permite acceder a la cámara en este contexto.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
      setCameraActive(false);

      if (err instanceof DOMException) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setCameraError(
            "Se denegó el acceso a la cámara. Revisa los permisos del navegador.",
          );
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          setCameraError("No se encontró ninguna cámara disponible.");
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          setCameraError(
            "La cámara está siendo utilizada por otra aplicación o no puede iniciarse.",
          );
        } else {
          setCameraError(err.message);
        }
      } else {
        setCameraError(
          err instanceof Error
            ? err.message
            : "No fue posible activar la cámara.",
        );
      }
    } finally {
      setCameraLoading(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setCameraError(null);
  }

  const validPatientId =
    Number.isSafeInteger(Number(patientId)) && Number(patientId) > 0;

  if (!validPatientId) {
    return (
      <div className="py-12 text-center text-sm text-destructive">
        Identificador de paciente inválido.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">
            Evaluación de movimiento · Paciente #{patientId}
          </p>

          <h1 className="mt-1 font-display text-3xl font-semibold">
            Cámara de evaluación
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {articulation
              ? `Articulación seleccionada: ${articulation}`
              : "No se ha seleccionado una articulación."}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            cameraActive
              ? "bg-accent-soft text-accent"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              cameraActive ? "bg-accent" : "bg-muted-foreground"
            }`}
          />

          {cameraActive ? "Cámara activa" : "Cámara apagada"}
        </span>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-clinical">
        <div className="relative grid aspect-video min-h-[360px] place-items-center overflow-hidden bg-muted">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-contain ${
              cameraActive ? "block" : "hidden"
            }`}
          />

          <div className="pointer-events-none absolute inset-5 rounded-md border border-primary/30">
            <span className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-primary" />
            <span className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-primary" />
            <span className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-primary" />
            <span className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-primary" />
          </div>

          {!cameraActive && (
            <div className="relative px-4 text-center">
              <span className="mx-auto grid size-20 place-items-center rounded-full border border-border bg-surface-raised text-primary">
                {cameraLoading ? (
                  <RotateCcw className="size-8 animate-spin" />
                ) : (
                  <CameraOff className="size-8" />
                )}
              </span>

              <p className="mt-4 text-sm font-semibold">
                {cameraLoading
                  ? "Activando cámara..."
                  : "Vista previa de la cámara"}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {cameraLoading
                  ? "Autoriza el acceso si el navegador lo solicita."
                  : "Enciende la cámara para visualizar al paciente."}
              </p>
            </div>
          )}

          {cameraActive && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-surface-glass px-5 py-3 backdrop-blur-xl">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Camera className="size-4 text-primary" />
                Vista previa activa
              </span>

              <span className="text-xs text-muted-foreground">
                Sin grabación ni medición
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <RotateCcw className="size-4" />
            </span>

            <div>
              <p className="text-sm font-semibold">
                Preparación de la evaluación
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Mantén visible la articulación seleccionada. El profesional debe
                indicar el movimiento específico antes de realizar cualquier
                medición.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/patients/$patientId/evaluation" params={{ patientId }}>
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            </Button>

            {cameraActive ? (
              <Button variant="secondary" onClick={stopCamera}>
                <CameraOff className="size-4" />
                Apagar cámara
              </Button>
            ) : (
              <Button
                onClick={() => void startCamera()}
                disabled={cameraLoading || !articulation}
              >
                <ShieldCheck className="size-4" />
                {cameraLoading ? "Activando..." : "Encender cámara"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {cameraError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="size-5 shrink-0" />
          <p>{cameraError}</p>
        </div>
      )}

      {!articulation && (
        <div className="rounded-md border border-info-border bg-info-soft p-4 text-sm text-info">
          Selecciona una articulación desde la pantalla de preparación antes de
          activar la cámara.
        </div>
      )}

      <div className="rounded-md border border-info-border bg-info-soft p-4 text-xs leading-5 text-info">
        La cámara muestra una vista previa en tiempo real. Esta versión no graba
        video, no calcula ángulos articulares y no envía imágenes ni mediciones
        al backend.
      </div>
    </div>
  );
}
