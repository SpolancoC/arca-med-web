import { normalizeSearch } from "@/lib/search-normalization";
import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@/lib/router";
import { Search, Users, UserPlus, Pencil } from "lucide-react";

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

      try {
        const data = await (isAdmin ? getRegisteredPatients() : getMedicalPatients());

        if (active) {
          setPatients(data);
        }
      } catch (err) {
        if (active) {
          const status = (err as { status?: number })?.status;

          setError(
            isDoctor && status === 404
              ? "El directorio médico está preparado, pero todavía falta habilitar GET /pacientes en el backend."
              : status === 403
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
  }, [isAdmin, isDoctor]);

  const [editing, setEditing] = useState<RegisteredPatient | null>(null);
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

  const filteredPatients = patients.filter((patient) => {
    const term = normalizeSearch(search);

    return (
      normalizeSearch(patient.nombre).includes(term) ||
      normalizeSearch(patient.email).includes(term) ||
      String(patient.id).includes(term)
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
            El directorio general todavía no está disponible para el rol médico.
            <p className="mt-2">
              Se necesita un endpoint de consulta autorizado para médicos. La
              lista de triaje continúa disponible en su sección correspondiente.
            </p>
          </div>
        </Section>
      ) : (
        <Section
          title={isAdmin ? "Pacientes registrados" : "Directorio médico de pacientes"}
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {/* Buscador de pacientes */}
              <label className="flex w-full min-w-0 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 sm:w-48 lg:w-64">
                <Search className="size-4 shrink-0 text-muted-foreground" />

                <input
                  aria-label="Buscar pacientes"
                  type="search"
                  placeholder="Buscar pacientes..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
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

          {isAdmin && editing && (
            <Section title={`Editar paciente #${editing.id}`}>
              <form onSubmit={savePatient} className="mt-4 space-y-4">
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
            </Section>
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

            {error && (
              <p
                role="alert"
                className="py-8 text-center text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-border text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="pb-3 font-semibold">Paciente</th>
                      <th className="pb-3 font-semibold">Identificador</th>
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
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                              {getInitials(patient.nombre)}
                            </span>

                            <span className="font-semibold">
                              {patient.nombre}
                            </span>
                          </div>
                        </td>

                        <td className="py-4">#{patient.id}</td>

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
                            <Button type="button" size="sm" variant="secondary" onClick={() => openEditor(patient)}>
                              <Pencil className="size-4" /> Editar
                            </Button>
                          ) : (
                            <Button asChild size="sm" variant="secondary">
                              <Link to="/patients/$patientId" params={{ patientId: String(patient.id) }}>
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
                          No se encontraron pacientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {isDoctor && <div className="mt-4 border-t border-border pt-4">
              <Button asChild variant="secondary">
                <Link to="/triage">Ir a Triaje</Link>
              </Button>
            </div>}
          </div>
        </Section>
      )}
    </div>
  );
}
