import { Link, createFileRoute } from "@/lib/router";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Recuperar acceso — ARCA Med" },
    { name: "description", content: "Información para solicitar la recuperación de acceso a ARCA Med." },
    { property: "og:title", content: "Recuperar acceso — ARCA Med" },
    { property: "og:description", content: "Recuperación de acceso mediante el administrador autorizado." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ForgotPassword,
});

const ADMIN_CONTACT = "admin@arcamed.com";
const mailSubject = encodeURIComponent("ARCA Med — Solicitud de recuperación de acceso");
const mailBody = encodeURIComponent(
  "Hola, necesito ayuda para recuperar el acceso a ARCA Med.\n\n" +
  "Por favor, indíquenme el procedimiento de verificación de identidad y restablecimiento de contraseña.\n\n" +
  "No adjuntaré contraseñas ni información clínica a este mensaje."
);

function ForgotPassword() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-white p-1.5 shadow-sm" aria-hidden="true">
            <img src="/arca-logo.svg" alt="" className="size-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold">ARCA Med</p>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Evaluación musculoesquelética</p>
          </div>
        </div>
        <section className="rounded-lg border border-border bg-card/75 p-6 shadow-clinical backdrop-blur-md sm:p-8">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
              <ShieldCheck className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase text-accent">Recuperar acceso</p>
            <h1 className="mt-2 font-display text-3xl font-semibold">¿Olvidaste tu contraseña?</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Por ahora, ARCA Med no dispone de recuperación automática. Solicita ayuda a un
              administrador autorizado para verificar tu identidad y gestionar el restablecimiento.
            </p>
          </div>
          <div className="mt-6 rounded-md border border-border bg-surface-raised p-4 text-sm leading-6">
            <p className="font-semibold">¿Qué debes hacer?</p>
            <p className="mt-1 text-muted-foreground">
              Contacta a la administración de ARCA Med por el canal de comunicación autorizado.
              Nunca envíes tu contraseña ni información clínica por correo.
            </p>
          </div>
          <Button asChild className="mt-6 w-full">
            <a href={`mailto:${ADMIN_CONTACT}?subject=${mailSubject}&body=${mailBody}`}>
              <Mail className="size-4" aria-hidden="true" />
              Redactar correo al administrador
            </a>
          </Button>
          <p className="mt-2 text-center text-xs leading-5 text-muted-foreground">
            Este botón abre tu aplicación de correo. No registra ni envía una solicitud automáticamente.
          </p>
          <Button asChild variant="ghost" className="mt-4 w-full">
            <Link to="/login"><ArrowLeft className="size-4" aria-hidden="true" /> Volver al inicio de sesión</Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
