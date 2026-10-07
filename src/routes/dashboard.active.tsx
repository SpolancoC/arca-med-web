import { Link, createFileRoute } from "@/lib/router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { BackButton, DataTable, Initials, PageHeader, SearchBox, StatusPill } from "@/components/arca/ui-kit";
import { profileFor } from "@/lib/arca-data";
import { useMockPatients } from "@/lib/mock-store";

export const Route = createFileRoute("/dashboard/active")({
  head: () => ({ meta: [
    { title: "Pacientes activos — ARCA Med" },
    { name: "description", content: "Listado de pacientes activos con estado, última evaluación y próxima revisión." },
    { property: "og:title", content: "Pacientes activos — ARCA Med" },
    { property: "og:description", content: "Pacientes en seguimiento activo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ActivePatients,
});

function ActivePatients() {
  const patients = useMockPatients();
  const [query, setQuery] = useState("");
  const shown = patients.filter((p) => `${p.name} ${p.id} ${p.condition}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/">Volver al panel</BackButton>} eyebrow="Panel principal" title="Pacientes activos" description="Pacientes en seguimiento clínico activo. Selecciona uno para abrir su ficha." />
    <Section title={`${shown.length} pacientes`} action={<SearchBox value={query} onChange={setQuery} placeholder="Buscar pacientes" />}>
      <DataTable minWidth={980} head={["Paciente", "ID", "Edad", "Diagnóstico", "Articulación", "Estado", "Última evaluación", "Próxima revisión", ""]}>
        {shown.map((p) => <tr key={p.id}>
          <td><div className="flex items-center gap-3"><Initials>{p.initials}</Initials><span className="font-semibold">{p.name}</span></div></td>
          <td className="text-muted-foreground">{p.id}</td><td>{p.age}</td><td>{p.condition}</td><td>{p.region}</td>
          <td><StatusPill>{p.status}</StatusPill></td><td>{p.lastEvaluation}</td><td>{profileFor(p.id).nextReview}</td>
          <td className="text-right"><Button asChild variant="secondary" size="sm"><Link to="/patients/$patientId" params={{ patientId: p.id }}>Ver ficha</Link></Button></td>
        </tr>)}
      </DataTable>
    </Section>
  </div>;
}
