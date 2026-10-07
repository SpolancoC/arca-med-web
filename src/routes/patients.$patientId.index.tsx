import { Link, createFileRoute } from "@/lib/router";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Info,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ClinicalSummary,
  Metric,
  RomChart,
  Section,
  TriageBadge,
} from "@/components/arca/clinical";
import { exercises, patients, romMeasurements } from "@/lib/arca-data";

export const Route = createFileRoute("/patients/$patientId/")({
  head: () => ({
    meta: [
      { title: "Ficha del paciente — ARCA Med" },
      {
        name: "description",
        content:
          "Ficha clínica longitudinal con triaje, rango de movimiento y plan de rehabilitación.",
      },
      { property: "og:title", content: "Ficha del paciente — ARCA Med" },
      {
        property: "og:description",
        content: "Evaluación clínica y registro de rehabilitación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientDetail,
});

function PatientDetail() {
  const { patientId } = Route.useParams();
  const patient = patients.find((item) => item.id === patientId) ?? patients[0];
  if (!patient) return null;
  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-border bg-card/75 p-5 shadow-clinical backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
              {patient.initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold">
                  {patient.name}
                </h1>
                <span className="rounded-full bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
                  Atención activa
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {patient.age} años · {patient.id} · Última evaluación{" "}
                {patient.lastEvaluation}
              </p>
              <p className="mt-1 text-sm font-medium">
                Región principal: {patient.region}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/patients/$patientId/evaluation" params={{ patientId }}>
                <ClipboardCheck className="size-4" />
                Nueva evaluación
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/patients/$patientId/history" params={{ patientId }}>
                <CalendarDays className="size-4" />
                Ver historial
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/patients/$patientId/recommend" params={{ patientId }}>
                <BookOpen className="size-4" />
                Recomendar ejercicio
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="grid gap-4 xl:grid-cols-3">
        <Section title="Síntomas">
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Dolor medial de rodilla, 5/10 al subir escaleras</li>
            <li>• Rigidez matinal menor a 20 minutos</li>
            <li>• Hinchazón intermitente después de la actividad</li>
          </ul>
        </Section>
        <Section title="Historia clínica">
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Síntomas durante ocho meses. Hipertensión controlada con
            medicamentos. Sin cirugías previas de rodilla.
          </p>
        </Section>
        <Section title="Documentos relevantes">
          <div className="mt-3 space-y-2">
            {[
              "Radiografía con carga",
              "Nota de derivación",
              "Evaluación inicial",
            ].map((document) => (
              <button
                key={document}
                className="flex w-full items-center gap-2 rounded-md border border-border bg-surface-raised/60 p-2 text-left text-sm"
              >
                <FileText className="size-4 text-primary" />
                {document}
              </button>
            ))}
          </div>
        </Section>
      </div>
      <Section
        title="Triaje"
        description="Revisión de apoyo a la decisión clínica · 19 sep 2026"
        action={<TriageBadge priority="High" />}
      >
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold text-primary">
              Hallazgos principales
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Limitación progresiva del rango de movimiento con nuevo derrame
              relacionado con la actividad.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-primary">
              Síntomas relevantes
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Niega dolor nocturno. Sin bloqueo, inestabilidad, fiebre ni
              traumatismo reciente.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-primary">
              Consideraciones clínicas
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Revisar la progresión de carga y la respuesta inflamatoria antes
              de avanzar el fortalecimiento.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 rounded-md border border-info-border bg-info-soft p-3 text-xs leading-5 text-info">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            El triaje apoya la toma de decisiones clínicas. La decisión final es
            responsabilidad del profesional de la salud.
          </p>
        </div>
      </Section>
      <ClinicalSummary />
      <Section
        title="Rango de movimiento"
        description="Flexión de rodilla izquierda · historial longitudinal de mediciones"
        action={
          <div className="flex gap-2">
            <select className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs">
              <option>Rodilla izquierda</option>
            </select>
            <select className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs">
              <option>Últimas 6 semanas</option>
            </select>
          </div>
        }
      >
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Metric label="Medición actual" value="78°" trend="+7°" />
            <Metric label="Medición anterior" value="71°" />
            <Metric label="Objetivo clínico" value="110°" />
          </div>
          <RomChart data={romMeasurements} height={270} />
        </div>
      </Section>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Section
          title="Decisión clínica"
          description="Revisada por la Dra. Elena Martín"
        >
          <div className="mt-4 space-y-3">
            {["Evaluación clínica", "Decisión", "Recomendaciones", "Notas"].map(
              (label, index) => (
                <label
                  key={label}
                  className="block text-xs font-semibold text-muted-foreground"
                >
                  {label}
                  {index === 0 ? (
                    <textarea
                      defaultValue="Mejora de la movilidad con irritabilidad persistente relacionada con la actividad. Sin señales de alerta actuales."
                      className="mt-1 min-h-20 w-full rounded-md border border-border bg-surface-raised/70 p-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <input
                      defaultValue={
                        index === 1
                          ? "Continuar rehabilitación conservadora"
                          : index === 2
                            ? "Progresar la carga en cadena cerrada según tolerancia"
                            : "Revisar la respuesta de la hinchazón en 10–14 días"
                      }
                      className="mt-1 w-full rounded-md border border-border bg-surface-raised/70 p-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </label>
              ),
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button>
              <Stethoscope className="size-4" />
              Guardar decisión clínica
            </Button>
          </div>
        </Section>
        <Section
          title="Recomendaciones de ejercicios"
          description="2 recomendaciones pendientes de validación"
        >
          <div className="mt-4 space-y-3">
            {exercises.slice(0, 2).map((exercise) => (
              <article
                key={exercise.id}
                className="rounded-md border border-border bg-surface-raised/60 p-3"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{exercise.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exercise.region} · {exercise.objective} ·{" "}
                      {exercise.difficulty}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-accent">
                    Borrador
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {exercise.repetitions} · {exercise.duration} · 5 días/semana
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm">Validar y asignar</Button>
                  <Button size="sm" variant="secondary">
                    Revisar
                  </Button>
                  <Button size="sm" variant="ghost">
                    Editar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
