import { Link, createFileRoute, useNavigate } from "@/lib/router";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { login } from "@/services/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — ARCA Med" },
      {
        name: "description",
        content: "Acceso profesional al espacio clínico de ARCA Med.",
      },
      { property: "og:title", content: "Iniciar sesión — ARCA Med" },
      {
        property: "og:description",
        content: "Acceso profesional al espacio clínico de ARCA Med.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      localStorage.setItem("arca-med-token", response.access_token);

      localStorage.setItem("arca-med-role", response.rol);

      await navigate({
        to: response.rol === "admin" ? "/admin/inicio" : response.rol === "paciente" ? "/mi-espacio" : "/",
        replace: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("No fue posible iniciar sesión. Inténtalo nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-3 py-6 text-foreground sm:px-4 sm:py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-white p-1.5 shadow-sm" aria-hidden="true">
            <img src="/arca-logo.svg" alt="" className="size-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold">ARCA Med</p>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              Evaluación musculoesquelética
            </p>
          </div>
        </div>
        <section className="rounded-lg border border-border bg-card/75 p-4 shadow-clinical backdrop-blur-md sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase text-accent">
              Ingreso personal de la salud
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder a ARCA Med.
            </p>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm font-semibold">
              Correo electrónico
              <span className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                <Mail className="size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nombre@centro.cl"
                  className="min-w-0 flex-1 bg-transparent font-normal outline-none"
                />
              </span>
            </label>
            <label className="block text-sm font-semibold">
              Contraseña
              <span className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                <LockKeyhole className="size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="min-w-0 flex-1 bg-transparent font-normal outline-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </span>
            </label>
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            {error && (
              <div
                role="alert"
                className="rounded-md border border-priority-high-border bg-priority-high px-3 py-2.5 text-sm text-priority-high-foreground"
              >
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </section>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Uso exclusivo para profesionales de la salud.
        </p>
      </div>
    </main>
  );
}
