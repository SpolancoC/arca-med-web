import { normalizeSearch } from "@/lib/search-normalization";
import { createFileRoute, useNavigate } from "@/lib/router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Section, TriageBadge } from "@/components/arca/clinical";
import { BackButton, Initials, PageHeader, SearchBox } from "@/components/arca/ui-kit";
import { useMockPatients } from "@/lib/mock-store";

export const Route = createFileRoute("/evaluations/new")({
  head: () => ({ meta: [
    { title: "Seleccionar paciente — ARCA Med" },
    { name: "description", content: "Selecciona el paciente para iniciar una nueva evaluación de movimiento." },
    { property: "og:title", content: "Seleccionar paciente — ARCA Med" },
    { property: "og:description", content: "Inicio de una nueva evaluación de movimiento." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SelectPatient,
});

function SelectPatient() {
  const patients = useMockPatients();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const shown = patients.filter((p) => normalizeSearch(`${p.name} ${p.id} ${p.region}`).includes(normalizeSearch(query)));
  return <div className="space-y-5">
    <PageHeader back={<BackButton to="/evaluations">Volver a evaluaciones</BackButton>} eyebrow="Nueva evaluación · Paso 1 de 3" title="Seleccionar paciente" description="Elige el paciente. Luego continuarás con la preparación y la cámara." />
    <Section title="Pacientes" action={<SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre, ID o región" className="w-full sm:w-72" />}>
      <div className="mt-3 divide-y divide-border">
        {shown.map((p) => <button key={p.id} onClick={() => void navigate({ to: "/patients/$patientId/evaluation", params: { patientId: p.id } })} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md px-1 py-3 text-left transition-colors hover:bg-muted">
          <Initials>{p.initials}</Initials>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name}</p><p className="truncate text-xs text-muted-foreground">{p.age} años · {p.id} · {p.region}</p></div>
          <TriageBadge priority={p.priority} /><ChevronRight className="size-4 text-muted-foreground" />
        </button>)}
        {shown.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Ningún paciente coincide con la búsqueda.</p>}
      </div>
    </Section>
  </div>;
}
