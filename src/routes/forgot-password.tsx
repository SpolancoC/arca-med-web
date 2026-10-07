import { Link, createFileRoute } from "@/lib/router";
import { ArrowLeft, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Restablecer contraseña — ARCA Med" },
    { name: "description", content: "Recupera el acceso a tu espacio clínico de ARCA Med." },
    { property: "og:title", content: "Restablecer contraseña — ARCA Med" },
    { property: "og:description", content: "Recuperación de contraseña para profesionales de ARCA Med." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => { setLoading(false); setSent(true); }, 800);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-primary font-display text-lg font-semibold text-primary-foreground">A</div>
          <div className="leading-tight"><p className="font-display text-xl font-semibold">ARCA Med</p><p className="text-[10px] font-semibold uppercase text-muted-foreground">Evaluación musculoesquelética</p></div>
        </div>
        <section className="rounded-lg border border-border bg-card/75 p-6 shadow-clinical backdrop-blur-md sm:p-8">
          {sent ? (
            <div className="text-center" role="status">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent"><MailCheck className="size-7" /></span>
              <h1 className="mt-4 font-display text-3xl font-semibold">Revisa tu correo electrónico</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Enviamos las instrucciones para restablecer tu contraseña a <strong className="text-foreground">{email}</strong>. El enlace estará vigente durante 30 minutos.</p>
              <Button asChild className="mt-6 w-full"><Link to="/login">Volver al inicio de sesión</Link></Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase text-accent">Recuperar acceso</p>
                <h1 className="mt-2 font-display text-3xl font-semibold">Restablecer contraseña</h1>
                <p className="mt-2 text-sm text-muted-foreground">Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.</p>
              </div>
              <form onSubmit={submit} className="mt-7 space-y-4">
                <label className="block text-sm font-semibold">Correo electrónico
                  <span className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                    <Mail className="size-4 text-muted-foreground" />
                    <input type="email" required maxLength={255} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@centro.cl" className="min-w-0 flex-1 bg-transparent font-normal outline-none" />
                  </span>
                </label>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <><LoaderCircle className="size-4 animate-spin" />Enviando…</> : "Enviar instrucciones"}</Button>
              </form>
              <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/login"><ArrowLeft className="size-4" />Volver al inicio de sesión</Link></Button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
