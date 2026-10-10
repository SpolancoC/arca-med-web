import { createFileRoute, useNavigate } from "@/lib/router";
import {
  Bell,
  Laptop,
  Lock,
  Palette,
  SlidersHorizontal,
  Smartphone,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import {
  Field,
  PageHeader,
  SelectInput,
  TextInput,
} from "@/components/arca/ui-kit";
import { doctorProfile } from "@/lib/arca-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configuración — ARCA Med" },
      {
        name: "description",
        content:
          "Cuenta, preferencias, notificaciones, seguridad y apariencia de ARCA Med.",
      },
      { property: "og:title", content: "Configuración — ARCA Med" },
      {
        property: "og:description",
        content: "Ajustes del espacio clínico de ARCA Med.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

const tabs = [
  { id: "cuenta", label: "Cuenta", icon: User },
  { id: "preferencias", label: "Preferencias", icon: SlidersHorizontal },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "seguridad", label: "Seguridad", icon: Lock },
  { id: "apariencia", label: "Apariencia", icon: Palette },
] as const;

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted ring-1 ring-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-surface-raised shadow-clinical transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function Settings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("cuenta");
  const [notif, setNotif] = useState({
    evaluaciones: true,
    seguimiento: true,
    ejercicios: true,
    alertas: true,
    correo: false,
  });
  const [theme, setTheme] = useState("Claro");
  const [pwOpen, setPwOpen] = useState(false);
  const save = () =>
    toast.success("Cambios guardados", {
      description: "Tu configuración se actualizó correctamente.",
    });

  const password = (
    <div className="mt-4 rounded-md border border-border p-4">
      {pwOpen ? (
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPwOpen(false);
            toast.success("Contraseña actualizada");
          }}
        >
          <Field label="Contraseña actual">
            <TextInput type="password" required />
          </Field>
          <Field label="Nueva contraseña">
            <TextInput type="password" required minLength={8} />
          </Field>
          <Field label="Confirmar contraseña">
            <TextInput type="password" required minLength={8} />
          </Field>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" size="sm">
              Actualizar contraseña
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPwOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Contraseña</p>
            <p className="text-xs text-muted-foreground">
              •••••••• · actualizada hace 3 meses
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setPwOpen(true)}>
            Cambiar contraseña
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Espacio clínico"
        title="Configuración"
        description="Administra tu cuenta y las preferencias de la aplicación."
        action={<Button onClick={save}>Guardar cambios</Button>}
      />
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Secciones de configuración"
          className="flex gap-1 overflow-x-auto lg:flex-col"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                tab === t.id && "bg-primary-soft font-semibold text-primary",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>
        <div>
          {tab === "cuenta" && (
            <Section
              title="Cuenta"
              description="Datos de identificación de tu usuario."
            >
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <TextInput defaultValue={doctorProfile.name} />
                </Field>
                <Field label="Correo">
                  <TextInput type="email" defaultValue={doctorProfile.email} />
                </Field>
              </div>
              {password}
            </Section>
          )}
          {tab === "preferencias" && (
            <Section title="Preferencias">
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Idioma">
                  <SelectInput options={["Español", "English"]} />
                </Field>
                <Field label="Formato de fecha">
                  <SelectInput
                    options={["DD/MM/AAAA", "MM/DD/AAAA", "AAAA-MM-DD"]}
                  />
                </Field>
              </div>
              <div className="mt-2 divide-y divide-border">
                <Toggle
                  label="Notificaciones"
                  description="Recibir avisos dentro de la aplicación."
                  checked={notif.correo}
                  onChange={(v) => setNotif({ ...notif, correo: v })}
                />
              </div>
            </Section>
          )}
          {tab === "notificaciones" && (
            <Section
              title="Notificaciones"
              description="Elige qué avisos quieres recibir."
            >
              <div className="mt-2 divide-y divide-border">
                <Toggle
                  label="Nuevas evaluaciones"
                  description="Cuando un paciente complete una evaluación."
                  checked={notif.evaluaciones}
                  onChange={(v) => setNotif({ ...notif, evaluaciones: v })}
                />
                <Toggle
                  label="Recordatorios de seguimiento"
                  description="Controles programados de tus pacientes."
                  checked={notif.seguimiento}
                  onChange={(v) => setNotif({ ...notif, seguimiento: v })}
                />
                <Toggle
                  label="Revisiones de ejercicios"
                  description="Ejercicios que requieren tu revisión."
                  checked={notif.ejercicios}
                  onChange={(v) => setNotif({ ...notif, ejercicios: v })}
                />
                <Toggle
                  label="Alertas clínicas"
                  description="Cambios de prioridad en el triaje."
                  checked={notif.alertas}
                  onChange={(v) => setNotif({ ...notif, alertas: v })}
                />
              </div>
            </Section>
          )}
          {tab === "seguridad" && (
            <Section title="Seguridad">
              {password}
              <h3 className="mt-5 text-sm font-semibold">Sesiones activas</h3>
              <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                {[
                  {
                    icon: Laptop,
                    name: "Chrome · Santiago",
                    when: "Sesión actual",
                  },
                  {
                    icon: Smartphone,
                    name: "iPhone · Santiago",
                    when: "Hace 2 días",
                  },
                ].map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center gap-3 p-3 text-sm"
                  >
                    <s.icon className="size-4 text-muted-foreground" />
                    <span className="flex-1 font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.when}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant="destructive"
                className="mt-5"
                onClick={() => {
                  localStorage.removeItem("arca-med-token");
                  localStorage.removeItem("arca-med-role");

                  navigate({
                    to: "/login",
                    replace: true,
                  });
                }}
              >
                Cerrar sesión
              </Button>
            </Section>
          )}
          {tab === "apariencia" && (
            <Section title="Apariencia">
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["Claro", "Oscuro", "Según el sistema"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "rounded-md border border-border p-4 text-left text-sm font-semibold",
                      theme === t &&
                        "border-primary bg-primary-soft text-primary",
                    )}
                  >
                    {t}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      Tema de la aplicación
                    </span>
                  </button>
                ))}
              </div>
              <Field label="Preferencia visual" className="mt-4 max-w-sm">
                <SelectInput
                  options={["Estándar", "Compacta", "Alto contraste"]}
                />
              </Field>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
