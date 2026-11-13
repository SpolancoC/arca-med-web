import { normalizeSearch } from "@/lib/search-normalization";
import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { Search, Users, UserPlus, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";

import {
  getRegisteredPatients,
  getMedicalPatients,
  updatePatient,
  type RegisteredPatient,
} from "@/services/patients";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Pacientes — ARCA Med" },
      {
        name: "description",
        content: "Directorio de pacientes registrados.",
      },
    ],
  }),
  component: PatientsPage,
});

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function PatientsPage() {
  const [patients, setPatients] = useState<RegisteredPatient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const role = localStorage.getItem("arca-med-role");
  const isAdmin = role === "admin";
  const isDoctor = role === "medico";

  useEffect(() => {
    let active = true;

    if (!isAdmin && !isDoctor) {
      setLoading(false);
      return;
    }

    async function loadPatients() {
      setLoading(true);
      setError(null);
      setPatients([]);

      try {
        const data = await (isAdmin ? getRegisteredPatients() : getMedicalPatients());

        if (active) {
          setPatients(data);
        }
      } catch (err) {
        if (active) {
          const status = (err as { status?: number })?.status;

          setError(
            status === 403
              ? "Tu cuenta no tiene permiso para consultar este directorio."
              : err instanceof Error
                ? err.message
                : "No se pudieron cargar los pacientes.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPatients();

    return () => {
      active = false;
    };
  }, [isAdmin, isDoctor, reloadKey]);

  const [editing, setEditing] = useState<RegisteredPatient | null>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;
    if (editing && !dialog.open) dialog.showModal();
    if (!editing && dialog.open) dialog.close();
  }, [editing]);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function openEditor(patient: RegisteredPatient) {
    setEditing(patient);
    setEditName(patient.nombre);
    setEditEmail(patient.email);
    setEditActive(patient.activo);
    setEditError(null);
    setSuccess(null);
  }

  function closeEditor() {
    if (saving) return;
    setEditing(null);
    setEditError(null);
  }

  async function savePatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing || saving || !isAdmin) return;

    const nombre = editName.trim();
    const email = editEmail.trim().toLowerCase();

    if (!nombre || !email) {
      setEditError("El nombre y el correo son obligatorios.");
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const updated = await updatePatient(editing.id, {
        nombre,
        email,
        activo: editActive,
      });

      setPatients((current) =>
        current.map((patient) =>
          patient.id === editing.id ? updated : patient,
        ),
      );

      setSuccess(
        `Los cambios de ${updated.nombre} se guardaron correctamente.`,
      );
      setEditing(null);
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setSaving(false);
    }
  }

  const searchTerm = normalizeSearch(search);
  const filteredPatients = patients.filter((patient) => {
    return (
      normalizeSearch(patient.nombre).includes(searchTerm) ||
      normalizeSearch(patient.email).includes(searchTerm) ||
      String(patient.id).includes(searchTerm)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-accent">
          Directorio clínico
        </p>

        <h1 className="mt-1 font-display text-3xl font-semibold">Pacientes</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Directorio general de pacientes registrados en ARCA Med.
        </p>
      </div>

      {!isAdmin && !isDoctor ? (
        <Section title="Directorio de pacientes">
          <div className="mt-4 rounded-md border border-info-border bg-info-soft p-4 text-sm text-info">
            Tu perfil no tiene acceso a este directorio.
          </div>
        </Section>
      ) : (
        <>
        <Section
          title={isAdmin ? "Pacientes registrados" : "Directorio médico de pacientes"}
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {/* Buscador de pacientes */}
              <label className="flex w-full min-w-0 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 sm:w-48 lg:w-64">
                <Search className="size-4 shrink-0 text-muted-foreground" />

                <input
                  aria-label="Buscar pacientes"
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                    onClick={() => setSearch("")}
                    className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-primary-soft/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </label>

              {/* Botón para crear paciente */}
              {isAdmin && <Button asChild className="w-full shrink-0 sm:w-auto">
                <Link
                  to="/patients/new"
                  className="flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <UserPlus className="size-4 shrink-0" />
                  <span>Nuevo paciente</span>
                </Link>
              </Button>}
            </div>
          }
        >
          {success && (
            <p
              role="status"
              className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
            >
              {success}
            </p>
          )}

          <div className="mt-4">
            {!loading && !error && (
              <p className="mb-4 text-sm text-muted-foreground">
                Mostrando {filteredPatients.length} de {patients.length}{" "}
                pacientes
              </p>
            )}

            {loading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Cargando pacientes...
              </p>
            )}

            {!loading && error && (
              <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button type="button" variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>
                  Reintentar carga
                </Button>
              </div>
            )}

            {!loading && !error && patients.length === 0 && (
              <div role="status" className="py-10 text-center text-sm text-muted-foreground">
                <Users className="mx-auto mb-2 size-6" />
                {isAdmin
                  ? "No hay pacientes registrados todavía."
                  : "No hay pacientes activos disponibles en el directorio médico."}
              </div>
            )}

            {!loading && !error && patients.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="pb-3 font-semibold">Identificador</th>
                      <th className="pb-3 font-semibold">Paciente</th>
                      <th className="pb-3 font-semibold">Correo electrónico</th>
                      <th className="pb-3 font-semibold">Estado</th>
                      <th className="pb-3 text-right font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="py-4">#{patient.id}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                              {getInitials(patient.nombre)}
                            </span>

                            {isDoctor ? (
                              <Link
                                to="/patients/$patientId?desde=directorio"
                                params={{ patientId: String(patient.id) }}
                                className="rounded-sm font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={`Abrir ficha clínica de ${patient.nombre}`}
                              >
                                {patient.nombre}
                              </Link>
                            ) : (
                              <span className="font-semibold">
                                {patient.nombre}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 text-muted-foreground">
                          {patient.email}
                        </td>

                        <td className="py-4">
                          <span
                            className={
                              patient.activo
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {patient.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className="py-4 text-right">
                          {isAdmin ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openEditor(patient)}
                              className="group cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <Pencil className="size-4" />
                              Editar
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant="secondary">
                              <Link to="/patients/$patientId?desde=directorio" params={{ patientId: String(patient.id) }}>
                                Ver ficha
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredPatients.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <Users className="mx-auto mb-2 size-6" />
                          No se encontraron pacientes con esa búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </Section>
          {isAdmin && editing && (
            <dialog
              ref={editDialogRef}
              aria-labelledby="edit-patient-title"
              aria-modal="true"
              onCancel={(event) => {
                event.preventDefault();
                closeEditor();
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) closeEditor();
              }}
              className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-border bg-surface-raised p-0 text-foreground shadow-2xl backdrop:bg-slate-950/55"
            >
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <h2 id="edit-patient-title" className="font-display text-xl font-semibold">
                    Editar paciente #{editing.id}
                  </h2>
                  <button
                    type="button"
                    aria-label="Cerrar edición"
                    disabled={saving}
                    onClick={closeEditor}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <form onSubmit={savePatient} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-patient-name"
                      className="text-sm font-medium"
                    >
                      Nombre completo
                    </label>
                    <input
                      id="edit-patient-name"
                      type="text"
                      required
                      maxLength={150}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-patient-email"
                      className="text-sm font-medium"
                    >
                      Correo electrónico
                    </label>
                    <input
                      id="edit-patient-email"
                      type="email"
                      required
                      value={editEmail}
                      onChange={(event) => setEditEmail(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-md border border-border p-3">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(event) => setEditActive(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm">
                    <span className="block font-medium">Cuenta activa</span>
                    <span className="text-muted-foreground">
                      Si desactivas esta cuenta, el paciente no podrá iniciar
                      una nueva sesión.
                    </span>
                  </span>
                </label>

                {editError && (
                  <p role="alert" className="text-sm text-destructive">
                    {editError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    onClick={closeEditor}
                  >
                    Cancelar
                  </Button>

                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
              </div>
            </dialog>
          )}
        </>
      )}
    </div>
  );
}
