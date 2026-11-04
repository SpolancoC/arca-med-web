import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { AlertCircle, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, PageHeader } from "@/components/arca/ui-kit";
import { getMedicalPatients, type RegisteredPatient } from "@/services/patients";

export const Route = createFileRoute("/dashboard/active")({
  head: () => ({ meta: [{ title: "Pacientes activos — ARCA Med" }] }),
  component: ActivePatients,
});

function ActivePatients() {
  const [patients, setPatients] = useState<RegisteredPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getMedicalPatients().then(
      (items) => {
        if (!active) return;
        setPatients(items);
        setLoading(false);
      },
      (cause: unknown) => {
        if (!active) return;
        setPatients([]);
        setLoading(false);
        setError(cause instanceof Error ? cause.message : "No fue posible cargar el directorio médico.");
      },
    );
    return () => { active = false; };
  }, [reload]);

  return (
    <div className="space-y-5">
      <PageHeader
        back={<BackButton to="/">Volver al panel</BackButton>}
        eyebrow="Panel principal"
        title="Pacientes activos"
        description="Cuentas activas con rol paciente disponibles en el directorio médico. No representa pacientes necesariamente en tratamiento."
      />
      <Section title="Directorio médico" description="Información real obtenida mediante GET /pacientes">
        <div className="mt-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando pacientes…</p>
          ) : error ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 p-4 text-sm text-destructive">
              <AlertCircle className="size-4" /> No se pudo cargar el directorio: {error}
              <Button variant="secondary" size="sm" onClick={() => setReload((x) => x + 1)}><RefreshCw className="size-4" /> Reintentar</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-raised/55 p-4">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-primary" />
                <div>
                  <p className="text-2xl font-semibold">{patients.length}</p>
                  <p className="text-xs text-muted-foreground">{patients.length === 1 ? "Paciente activo registrado" : "Pacientes activos registrados"}</p>
                </div>
              </div>
              <Button variant="secondary" asChild size="sm"><Link to="/patients">Abrir directorio</Link></Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Los pacientes pendientes de triaje se consultan por separado y no equivalen al total del directorio.</p>
        </div>
      </Section>
    </div>
  );
}
