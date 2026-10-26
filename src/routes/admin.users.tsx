import { normalizeSearch } from "@/lib/search-normalization";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@/lib/router";
import { Pencil, Plus, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import {
  createUser, editUser, listAdminUsers,
  type AdminUser, type CreateAdminUser, type UpdateAdminUser,
} from "@/services/admin-users";

type UserRole = AdminUser["rol"];
type RoleFilter = "todos" | UserRole;
const labels: Record<UserRole, string> = { admin: "Administrador", medico: "Médico", paciente: "Paciente" };
const emptyForm = { nombre: "", email: "", password: "", rol: "paciente" as UserRole, activo: true };

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — ARCA Med" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  async function reload() {
    setLoading(true);
    setError(null);
    try { setUsers(await listAdminUsers()); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => users.filter(user =>
    (roleFilter === "todos" || user.rol === roleFilter) &&
    normalizeSearch(`${user.id} ${user.nombre} ${user.email}`).includes(normalizeSearch(search)),
  ), [users, roleFilter, search]);

  function startCreate() {
    setEditing(null); setForm({ ...emptyForm }); setError(null); setMessage(null); setShowForm(true);
  }
  function startEdit(user: AdminUser) {
    setEditing(user);
    setForm({ nombre: user.nombre, email: user.email, password: "", rol: user.rol, activo: user.activo });
    setError(null); setMessage(null); setShowForm(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const nombre = form.nombre.trim();
    const email = form.email.trim().toLowerCase();
    if (!nombre || !email) { setError("Nombre y correo son obligatorios."); return; }
    if (!editing && form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (editing && form.password && form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    setSaving(true); setError(null);
    try {
      let result: AdminUser;
      if (editing) {
        const payload: UpdateAdminUser = { nombre, email, rol: form.rol, activo: form.activo };
        if (form.password) payload.password = form.password;
        result = await editUser(editing.id, payload);
      } else {
        const payload: CreateAdminUser = { nombre, email, rol: form.rol, password: form.password };
        result = await createUser(payload);
      }
      setShowForm(false); setEditing(null); setForm({ ...emptyForm });
      setMessage(`Usuario ${result.nombre} ${editing ? "actualizado" : "creado"} correctamente.`);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el usuario."); }
    finally { setSaving(false); }
  }

  const inputClass = "w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-accent">Administración</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona cuentas de administradores, médicos y pacientes.</p>
      </div>
      <Button onClick={startCreate}><Plus className="mr-2 size-4"/>Nuevo usuario</Button>
    </div>
    {message && <p role="status" className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">{message}</p>}
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {showForm && <Section title={editing ? `Editar usuario #${editing.id}` : "Crear usuario"}>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">Nombre<input required maxLength={150} className={inputClass} value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))}/></label>
          <label className="space-y-1 text-sm font-medium">Correo electrónico<input required type="email" className={inputClass} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></label>
          <label className="space-y-1 text-sm font-medium">Contraseña {editing ? "(opcional)" : "(mínimo 8 caracteres)"}<input type="password" autoComplete="new-password" minLength={8} required={!editing} className={inputClass} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/></label>
          <label className="space-y-1 text-sm font-medium">Rol<select className={inputClass} value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value as UserRole}))}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        {editing && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.activo} onChange={e=>setForm(p=>({...p,activo:e.target.checked}))}/> Cuenta activa</label>}
        <p className="text-xs text-muted-foreground">Por seguridad, el backend impide cambiar tu propio rol o desactivar tu cuenta.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear usuario"}</Button>
          <Button type="button" variant="outline" disabled={saving} onClick={()=>{setShowForm(false);setError(null);}}>Cancelar</Button>
        </div>
      </form>
    </Section>}
    <Section title="Directorio de usuarios" action={<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <label className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2"><Search className="size-4 shrink-0 text-muted-foreground"/><input type="search" aria-label="Buscar usuarios" placeholder="Buscar usuarios..." className="w-full min-w-0 bg-transparent text-sm outline-none sm:w-48" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <select aria-label="Filtrar por rol" value={roleFilter} onChange={e=>setRoleFilter(e.target.value as RoleFilter)} className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm"><option value="todos">Todos los roles</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <Button type="button" variant="outline" onClick={()=>void reload()} disabled={loading}><RefreshCw className="mr-2 size-4"/>Actualizar</Button>
    </div>}>
      {loading ? <p className="py-6 text-sm text-muted-foreground">Cargando usuarios...</p> : filtered.length === 0 ? <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground"><Users className="size-7"/>No hay usuarios para mostrar.</div> :
      <div className="mt-4 w-full overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-3 py-3">ID</th><th className="px-3 py-3">Nombre</th><th className="px-3 py-3">Correo</th><th className="px-3 py-3">Rol</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3 text-right">Acción</th></tr></thead>
        <tbody>{filtered.map(user=><tr key={user.id} className="border-b border-border/70"><td className="px-3 py-3">{user.id}</td><td className="px-3 py-3 font-medium">{user.nombre}</td><td className="px-3 py-3">{user.email}</td><td className="px-3 py-3"><span className="inline-flex items-center gap-1"><ShieldCheck className="size-3 text-muted-foreground"/>{labels[user.rol] ?? user.rol}</span></td><td className="px-3 py-3">{user.activo ? "Activo" : "Inactivo"}</td><td className="px-3 py-3 text-right"><Button variant="outline" size="sm" onClick={()=>startEdit(user)}><Pencil className="mr-1 size-3"/>Editar</Button></td></tr>)}</tbody>
      </table></div>}
    </Section>
  </div>;
}
