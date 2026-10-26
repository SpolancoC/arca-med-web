import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import {
  BackButton,
  Field,
  PageHeader,
  SuccessPanel,
  TextInput,
} from "@/components/arca/ui-kit";

import { createAdminUser } from "@/services/patients";

export const Route = createFileRoute("/patients/new")({
  component: NewPatient,
});

function NewPatient() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  const isAdmin = localStorage.getItem("arca-med-role") === "admin";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin || saving) return;

    const form = new FormData(event.currentTarget);

    const first = String(form.get("first") ?? "").trim();
    const last = String(form.get("last") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    setError(null);

    if (!first || !last || !email) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    if (
      new TextEncoder().encode(password).length < 8 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setError("La contraseña debe tener entre 8 y 72 bytes.");
      return;
    }

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);

    try {
      const patient = await createAdminUser({
        nombre: `${first} ${last}`,
        email,
        password,
        rol: "paciente",
      });

      setSaved({
        id: patient.id,
        nombre: patient.nombre,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar al paciente.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <Section title="Acceso restringido">
        <p className="mt-4 text-sm text-muted-foreground">
          Solo un administrador puede registrar cuentas de pacientes desde esta
          pantalla.
        </p>
        <Button asChild variant="secondary">
          <Link to="/patients">Volver a pacientes</Link>
        </Button>
      </Section>
    );
  }

  if (saved) {
    return (
      <div className="py-6">
        <SuccessPanel
          title="Cuenta de paciente creada"
          description={`Se registró correctamente a ${saved.nombre} con el identificador #${saved.id}. La ficha clínica todavía no se ha creado.`}
        >
          <Button asChild>
            <Link to="/patients">Volver a pacientes</Link>
          </Button>
        </SuccessPanel>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PageHeader
        back={<BackButton to="/patients">Volver a pacientes</BackButton>}
        eyebrow="Administración"
        title="Nuevo paciente"
        description="Registra una cuenta de paciente en ARCA Med."
      />

      <Section title="Datos de la cuenta">
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <TextInput
              name="first"
              required
              maxLength={60}
              placeholder="María"
            />
          </Field>

          <Field label="Apellidos *">
            <TextInput
              name="last"
              required
              maxLength={80}
              placeholder="González Rojas"
            />
          </Field>

          <Field label="Correo electrónico *">
            <TextInput
              type="email"
              name="email"
              required
              maxLength={255}
              placeholder="paciente@correo.cl"
            />
          </Field>

          <Field label="Contraseña *">
            <TextInput
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Confirmar contraseña *">
            <TextInput
              type="password"
              name="confirmation"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
        </div>
      </Section>

      <p className="text-sm text-muted-foreground">
        Este registro crea únicamente la cuenta de acceso. La información
        clínica se incorporará cuando el backend disponga de un endpoint para
        gestionarla.
      </p>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button asChild variant="secondary">
          <Link to="/patients">Cancelar</Link>
        </Button>

        <Button type="submit" disabled={saving}>
          <UserPlus className="size-4" />
          {saving ? "Registrando..." : "Registrar paciente"}
        </Button>
      </div>
    </form>
  );
}
