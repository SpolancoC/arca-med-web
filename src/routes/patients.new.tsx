import { Link, createFileRoute } from "@/lib/router";
import { UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, Field, PageHeader, SelectInput, SuccessPanel, TextArea, TextInput } from "@/components/arca/ui-kit";
import { addPatient } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients/new")({
  head: () => ({ meta: [
    { title: "Nuevo paciente — ARCA Med" },
    { name: "description", content: "Crea una nueva ficha clínica de paciente." },
    { property: "og:title", content: "Nuevo paciente — ARCA Med" },
    { property: "og:description", content: "Registro de un nuevo paciente musculoesquelético." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: NewPatient,
});

function ageFrom(date: string) {
  if (!date) return null;
  const birth = new Date(date); const now = new Date("2026-09-21");
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function NewPatient() {
  const [birth, setBirth] = useState("");
  const [side, setSide] = useState("Izquierdo");
  const [saved, setSaved] = useState<{ id: string; name: string } | null>(null);
  const age = ageFrom(birth);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const first = String(f.get("first")).trim(); const last = String(f.get("last")).trim();
    const id = `ARC-${1200 + Math.floor(Math.random() * 700)}`;
    const joint = String(f.get("joint"));
    addPatient({ id, name: `${first} ${last}`, initials: `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase(), age: age ?? 0, lastEvaluation: "Sin evaluaciones", priority: "Low", condition: String(f.get("diagnosis")).trim() || "Por definir", region: side === "Bilateral" ? `${joint} bilateral` : `${joint} ${side === "Izquierdo" ? "izquierda" : "derecha"}`, rom: "Sin medición", status: "Evaluación inicial pendiente" });
    setSaved({ id, name: `${first} ${last}` });
    window.scrollTo({ top: 0 });
  }

  if (saved) return <div className="py-6"><SuccessPanel title="Paciente guardado" description={`La ficha de ${saved.name} (${saved.id}) se creó correctamente y ya aparece en la lista de pacientes.`}><Button asChild variant="secondary"><Link to="/patients">Volver a la lista de pacientes</Link></Button><Button asChild><Link to="/patients/$patientId/evaluation" params={{ patientId: saved.id }}>Iniciar evaluación</Link></Button></SuccessPanel></div>;

  return <form onSubmit={submit} className="space-y-5">
    <PageHeader back={<BackButton to="/patients">Volver a pacientes</BackButton>} eyebrow="Directorio clínico" title="Nuevo paciente" description="Completa los datos para crear la ficha clínica. Los campos con * son obligatorios." />
    <Section title="Información personal">
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nombre *"><TextInput name="first" required maxLength={60} placeholder="María" /></Field>
        <Field label="Apellidos *"><TextInput name="last" required maxLength={80} placeholder="González Rojas" /></Field>
        <Field label="Fecha de nacimiento *"><TextInput type="date" required value={birth} onChange={(e) => setBirth(e.target.value)} max="2026-09-21" /></Field>
        <Field label="Edad"><div className="mt-1.5 rounded-md border border-dashed border-border bg-muted px-3 py-2.5 text-sm font-semibold text-foreground">{age === null ? "Se calcula automáticamente" : `${age} años`}</div></Field>
        <Field label="Sexo"><SelectInput name="sex" options={["Femenino", "Masculino", "Otro", "Prefiere no decir"]} /></Field>
        <Field label="Número de identificación *"><TextInput name="rut" required maxLength={20} placeholder="12.345.678-9" /></Field>
        <Field label="Correo electrónico"><TextInput type="email" name="email" maxLength={255} placeholder="paciente@correo.cl" /></Field>
        <Field label="Teléfono"><TextInput type="tel" name="phone" maxLength={20} placeholder="+56 9 1234 5678" /></Field>
      </div>
    </Section>
    <Section title="Información clínica">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Diagnóstico principal *"><TextInput name="diagnosis" required maxLength={120} placeholder="Ej. Artrosis de rodilla" /></Field>
        <Field label="Motivo de consulta"><TextInput name="reason" maxLength={200} placeholder="Ej. Dolor al subir escaleras" /></Field>
        <Field label="Articulación afectada"><SelectInput name="joint" options={["Rodilla", "Hombro", "Cadera", "Muñeca", "Tobillo", "Codo", "Columna"]} /></Field>
        <div className="text-xs font-semibold text-muted-foreground">Lado<div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md border border-border bg-surface-raised p-1" role="radiogroup">{["Izquierdo", "Derecho", "Bilateral"].map((s) => <button type="button" role="radio" aria-checked={side === s} key={s} onClick={() => setSide(s)} className={cn("rounded px-2 py-1.5 text-sm font-medium text-muted-foreground", side === s && "bg-primary-soft font-semibold text-primary")}>{s}</button>)}</div></div>
        <Field label="Antecedentes relevantes"><TextArea name="history" maxLength={1000} placeholder="Comorbilidades, cirugías, medicamentos…" /></Field>
        <Field label="Observaciones clínicas"><TextArea name="notes" maxLength={1000} placeholder="Hallazgos iniciales u otras observaciones" /></Field>
      </div>
    </Section>
    <Section title="Información de contacto">
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre de contacto de emergencia"><TextInput name="emergencyName" maxLength={100} /></Field>
        <Field label="Teléfono de emergencia"><TextInput type="tel" name="emergencyPhone" maxLength={20} /></Field>
      </div>
    </Section>
    <div className="flex justify-end gap-2"><Button asChild variant="secondary"><Link to="/patients">Cancelar</Link></Button><Button type="submit"><UserPlus className="size-4" />Guardar paciente</Button></div>
  </form>;
}
