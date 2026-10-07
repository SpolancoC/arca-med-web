import { Link, createFileRoute, useNavigate } from "@/lib/router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { PageHeader } from "@/components/arca/ui-kit";
import { getProfile, type UserProfile } from "@/services/profile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mi perfil — ARCA Med" },
      {
        name: "description",
        content:
          "Perfil profesional del médico: datos de contacto, centro y horario.",
      },
      { property: "og:title", content: "Mi perfil — ARCA Med" },
      {
        property: "og:description",
        content: "Perfil profesional en ARCA Med.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

const labels = {
  name: "Nombre completo",
  specialty: "Especialidad",
  email: "Correo",
  phone: "Teléfono",
  license: "Identificación profesional",
  clinic: "Clínica / centro",
  address: "Dirección del centro",
  schedule: "Horario de atención",
} as const;

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("No se pudo cargar el perfil:", error);
        toast("No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const initials =
    profile?.nombre
      ?.split(" ")
      .map((name) => name[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "--";

  const roleLabel =
    profile?.rol === "medico"
      ? "Médico"
      : profile?.rol === "admin"
        ? "Administrador"
        : profile?.rol === "paciente"
          ? "Paciente"
          : (profile?.rol ?? "");

  /*
   * Datos disponibles para mostrar en el perfil.
   *
   * Por ahora el backend solamente entrega nombre y rol.
   * Los demás campos se mantienen vacíos hasta que
   * estén disponibles en la API.
   */
  const profileData = {
    name: profile?.nombre ?? "",
    specialty: "",
    email: "",
    phone: "",
    license: "",
    clinic: "",
    address: "",
    schedule: "",
  };

  const handleLogout = () => {
    localStorage.removeItem("arca-med-token");
    localStorage.removeItem("arca-med-role");

    void navigate({
      to: "/login",
      replace: true,
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader eyebrow="Cuenta" title="Mi perfil" />

      <Section title="">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-20 place-items-center rounded-full bg-accent-soft font-display text-2xl font-semibold text-accent">
            {initials}
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold">
              {profile?.nombre ?? "Usuario"}
            </h2>

            <p className="text-sm text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {Object.entries(labels).map(([key, label]) => (
            <div key={key} className="rounded-md bg-muted p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>

              <dd className="mt-0.5 min-h-5 text-sm font-semibold">
                {profileData[key as keyof typeof profileData]}
              </dd>
            </div>
          ))}

          <div className="rounded-md bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Rol</dt>

            <dd className="mt-0.5 min-h-5 text-sm font-semibold">
              {roleLabel}
            </dd>
          </div>
        </dl>
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link to="/settings">Cambiar contraseña</Link>
        </Button>

        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
