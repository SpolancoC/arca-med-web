import { Link, createFileRoute } from "@/lib/router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, DataTable, PageHeader, StatusPill } from "@/components/arca/ui-kit";
import { exerciseReviews, exercises, patients } from "@/lib/arca-data";

export const Route = createFileRoute("/dashboard/exercise-reviews")({
  head: () => ({ meta: [
    { title: "Revisiones de ejercicios pendientes — ARCA Med" },
    { name: "description", content: "Ejercicios asignados a pacientes que requieren revisión profesional." },
    { property: "og:title", content: "Revisiones de ejercicios pendientes — ARCA Med" },
    { property: "og:description", content: "Seguimiento de ejercicios pendientes de revisión." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ExerciseReviews,
});

function ExerciseReviews() {
  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/">Volver al panel</BackButton>} eyebrow="Panel principal" title="Revisiones de ejercicios pendientes" description="Ejercicios enviados a pacientes que requieren tu revisión." />
    <Section title={`${exerciseReviews.length} revisiones pendientes`}>
      <DataTable minWidth={860} head={["Paciente", "Ejercicio", "Fecha de asignación", "Estado", "Motivo de revisión", ""]}>
        {exerciseReviews.map((r) => <tr key={r.id}>
          <td className="font-semibold">{patients.find((p) => p.id === r.patientId)?.name}</td>
          <td>{exercises.find((e) => e.id === r.exerciseId)?.name}</td><td>{r.assigned}</td>
          <td><StatusPill>{r.status}</StatusPill></td><td className="text-muted-foreground">{r.reason}</td>
          <td className="text-right"><Button asChild variant="secondary" size="sm"><Link to="/exercises/$exerciseId" params={{ exerciseId: String(r.exerciseId) }}>Revisar<ChevronRight className="size-3.5" /></Link></Button></td>
        </tr>)}
      </DataTable>
    </Section>
  </div>;
}
