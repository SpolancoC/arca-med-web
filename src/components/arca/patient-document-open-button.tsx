import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchPatientDocumentFile } from "@/services/patient-detail";

interface PatientDocumentOpenButtonProps {
  patientId: number;
  documentId: number;
  filename: string;
}

/** Abre el documento sin exponer el token de sesión en la URL. */
export function PatientDocumentOpenButton({ patientId, documentId, filename }: PatientDocumentOpenButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    if (loading) return;
    setError(null);
    // Abrir inmediatamente tras el clic evita bloqueos de ventanas emergentes en móviles.
    const preview = window.open("about:blank", "_blank");
    if (!preview) {
      setError("El navegador bloqueó la vista previa. Permite las ventanas emergentes para abrir el examen.");
      return;
    }
    try {
      preview.opener = null;
      preview.document.title = `Examen: ${filename}`;
      preview.document.body.textContent = "Abriendo examen…";
      setLoading(true);
      const blob = await fetchPatientDocumentFile(patientId, documentId);
      const url = URL.createObjectURL(blob);
      preview.location.replace(url);
      // El visor necesita disponer del objeto durante su carga.
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch (cause) {
      preview.close();
      setError(cause instanceof Error ? cause.message : "No se pudo abrir el examen.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="mt-2">
    <button type="button" onClick={handleOpen} disabled={loading}
      aria-label={`Abrir examen ${filename}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted disabled:opacity-60">
      <ExternalLink className="size-3.5" />{loading ? "Abriendo…" : "Abrir examen"}
    </button>
    {error && <p role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
  </div>;
}
