import { normalizeSearch } from "@/lib/search-normalization";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@/lib/router";
import { BookMarked, Plus, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/services/profile";
import {
  listClinicalGuides, createClinicalGuide, type ClinicalGuide,
} from "@/services/clinical-guides";

export const Route = createFileRoute("/guias-clinicas")({
  head: () => ({ meta: [{ title: "Guías clínicas — ARCA Med" }] }),
  component: ClinicalGuidesPage,
});

function ClinicalGuidesPage() {
  const [guides, setGuides] = useState<ClinicalGuide[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const data = await listClinicalGuides();
      setGuides(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las guías clínicas.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let alive = true;
    void getProfile().then(p => { if (alive) setIsAdmin(p.rol === "admin"); })
      .catch(() => { if (alive) setIsAdmin(false); });
    void reload();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => guides.filter(g =>
    normalizeSearch(g.titulo).includes(normalizeSearch(query)),
  ), [guides, query]);
  const selected = guides.find(g => g.id === selectedId) ?? null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin || saving) return;
    if (!title.trim() || !content.trim()) {
      setFormError("El título y el contenido son obligatorios."); return;
    }
    setSaving(true); setFormError(null); setSuccess(null);
    try {
      const added = await createClinicalGuide({ titulo: title.trim(), contenido: content.trim() });
      setCreating(false); setTitle(""); setContent("");
      await reload();
      setSelectedId(added.id);
      setSuccess("Guía clínica creada correctamente.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo crear la guía.");
    } finally { setSaving(false); }
  }

  const inputClass = "w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">{isAdmin ? "Administración" : "Espacio clínico"}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Guías clínicas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta el material clínico disponible en ARCA Med.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void reload()} disabled={loading}>
            <RefreshCw className="mr-2 size-4" />Actualizar
          </Button>
          {isAdmin && <Button onClick={() => { setCreating(true); setFormError(null); setSuccess(null); }}>
            <Plus className="mr-2 size-4" />Nueva guía
          </Button>}
        </div>
      </header>
      {error && <div role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}
      {success && <div role="status" className="rounded-md border border-border bg-surface-raised p-3 text-sm">{success}</div>}
      <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-md border border-border bg-surface-raised p-4">
          <label className="mb-3 flex items-center gap-2 rounded-md border border-border bg-background px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input aria-label="Buscar guía por título" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por título..." className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
          </label>
          <p className="mb-3 text-xs text-muted-foreground">{filtered.length} guía(s)</p>
          {loading ? <p className="text-sm text-muted-foreground">Cargando guías...</p> : filtered.length === 0 ?
            <p className="text-sm text-muted-foreground">No hay guías que coincidan con la búsqueda.</p> :
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {filtered.map(g => <button key={g.id} type="button" onClick={() => setSelectedId(g.id)}
                aria-pressed={g.id === selectedId}
                className={`w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted ${g.id === selectedId ? "border-primary bg-primary-soft" : "border-border bg-background"}`}>
                <span className="flex items-start gap-2"><BookMarked className="mt-0.5 size-4 shrink-0 text-primary" /><span className="font-medium break-words">{g.titulo}</span></span>
              </button>)}
            </div>}
        </section>
        <section className="min-w-0 rounded-md border border-border bg-surface-raised p-5">
          {selected ? <>
            <p className="text-xs font-semibold uppercase text-accent">Guía clínica #{selected.id}</p>
            <h2 className="mt-1 font-display text-xl font-semibold break-words">{selected.titulo}</h2>
            <p className="mt-2 text-xs text-muted-foreground">Creada: {new Date(selected.creado_en).toLocaleDateString("es-CL")}</p>
            <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">{selected.contenido}</div>
          </> : <div className="grid min-h-52 place-items-center text-center text-sm text-muted-foreground">
            Selecciona una guía para leer su contenido.
          </div>}
        </section>
      </div>
      {creating && isAdmin && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !saving) setCreating(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="new-guide-title" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-background p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-2"><h2 id="new-guide-title" className="font-display text-xl font-semibold">Nueva guía clínica</h2>
            <Button type="button" variant="ghost" size="icon" aria-label="Cerrar formulario" disabled={saving} onClick={() => setCreating(false)}><X className="size-4" /></Button>
          </div>
          <form className="space-y-4" onSubmit={e => void submit(e)}>
            <label className="block space-y-1 text-sm font-medium">Título
              <input className={inputClass} required maxLength={255} value={title} onChange={e => setTitle(e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-medium">Contenido
              <textarea className={inputClass} required rows={10} value={content} onChange={e => setContent(e.target.value)} />
            </label>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreating(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Crear guía"}</Button>
            </div>
          </form>
        </section>
      </div>}
    </div>
  );
}
