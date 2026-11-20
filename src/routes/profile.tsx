import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@/lib/router";
import { LogOut, Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/arca/clinical";
import { PageHeader } from "@/components/arca/ui-kit";
import { fetchProfilePhoto, getProfile, removeProfilePhoto, updateProfile, uploadProfilePhoto, type UserProfile } from "@/services/profile";

export const Route = createFileRoute("/profile")({ head: () => ({ meta: [{ title: "Mi perfil — ARCA Med" }] }), component: Profile });
function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [sex, setSex] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function apply(data: UserProfile) {
    setProfile(data); setName(data.nombre); setPhone(data.telefono || "");
    setBirth(data.fecha_nacimiento || ""); setSex(data.sexo || "");
  }
  useEffect(() => {
    let active = true;
    void getProfile().then(data => { if(active) apply(data); }).catch(e => {if(active) setError(e instanceof Error ? e.message : "No se pudo cargar el perfil.");}).finally(()=>{if(active)setLoading(false);});
    return () => { active=false; };
  }, []);
  useEffect(() => {
    if (!profile?.foto_url) {setPhoto(null);return;}
    let active=true; let objectUrl: string | null=null;
    void fetchProfilePhoto().then(url=>{objectUrl=url;if(active)setPhoto(url);else URL.revokeObjectURL(url);}).catch(()=>{if(active)setPhoto(null);});
    return()=>{active=false;if(objectUrl) URL.revokeObjectURL(objectUrl);};
  },[profile?.foto_url]);
  async function save(e: FormEvent) {
    e.preventDefault(); if(!profile) return;setSaving(true);setError("");setMessage("");
    try {apply(await updateProfile({nombre:name.trim(),telefono:phone.trim() || null,fecha_nacimiento:birth || null,sexo:sex || null}));setMessage("Perfil actualizado correctamente.");}
    catch(e){setError(e instanceof Error ? e.message : "No se pudo guardar el perfil.");}finally{setSaving(false);}
  }
  async function changePhoto(file: File | undefined) {
    if(!file)return;
    if(!["image/jpeg","image/png"].includes(file.type)){setError("Selecciona una imagen JPG o PNG.");return;}
    if(file.size > 5*1024*1024){setError("La imagen debe pesar menos de 5 MB.");return;}
    setSaving(true);setError("");setMessage("");
    try{apply(await uploadProfilePhoto(file));setMessage("Fotografía actualizada.");}
    catch(e){setError(e instanceof Error ? e.message : "No se pudo subir la fotografía.");}finally{setSaving(false);}
  }
  async function deletePhoto() {
    if(!window.confirm("¿Eliminar tu fotografía de perfil?"))return;
    setSaving(true);setError("");setMessage("");
    try{apply(await removeProfilePhoto());setPhoto(null);setMessage("Fotografía eliminada.");}
    catch(e){setError(e instanceof Error ? e.message : "No se pudo eliminar la fotografía.");}finally{setSaving(false);}
  }
  function logout(){localStorage.removeItem("arca-med-token");localStorage.removeItem("arca-med-role");void navigate({to:"/login",replace:true});}
  if(loading)return <p className="text-sm text-muted-foreground">Cargando perfil...</p>;
  if(!profile)return <p role="alert" className="text-sm text-destructive">{error || "No se pudo cargar el perfil."}</p>;
  const initials=profile.nombre.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase();
  return <div className="mx-auto max-w-3xl space-y-5">
    <PageHeader eyebrow="Cuenta" title="Mi perfil" description="Consulta y actualiza tus datos personales."/>
    {error && <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="rounded-md border border-border p-3 text-sm">{message}</p>}
    <Section title="Información personal">
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {photo ? <img src={photo} alt="Foto de perfil" className="size-20 rounded-full object-cover"/> : <div className="grid size-20 place-items-center rounded-full bg-accent-soft font-semibold text-accent">{initials}</div>}
        <div className="min-w-0"><p className="break-words font-semibold">{profile.nombre}</p><p className="break-all text-sm text-muted-foreground">{profile.email}</p><p className="text-sm capitalize text-muted-foreground">{profile.rol === "medico" ? "Médico" : profile.rol === "admin" ? "Administrador" : "Paciente"}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><Camera className="size-4"/>Cambiar foto<input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={saving} onChange={e=>{void changePhoto(e.target.files?.[0]);e.target.value="";}}/></label>
        {profile.foto_url && <Button type="button" variant="secondary" disabled={saving} onClick={()=>void deletePhoto()}><Trash2 className="mr-2 size-4"/>Eliminar foto</Button>}
      </div>
      <form onSubmit={e=>void save(e)} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">Nombre completo<input required minLength={2} maxLength={150} value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
        <label className="text-sm">Teléfono<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+56912345678" className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
        <label className="text-sm">Fecha de nacimiento<input type="date" value={birth} max={new Date().toISOString().slice(0,10)} onChange={e=>setBirth(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"/></label>
        <label className="text-sm">Sexo<select value={sex} onChange={e=>setSex(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-2"><option value="">No especificado</option><option value="femenino">Femenino</option><option value="masculino">Masculino</option><option value="otro">Otro</option><option value="prefiero_no_decir">Prefiero no decir</option></select></label>
        {profile.edad !== null && <p className="self-end text-sm text-muted-foreground">Edad registrada: {profile.edad} años</p>}
        <div className="sm:col-span-2 flex flex-wrap gap-2"><Button type="submit" disabled={saving || !name.trim()}>{saving ? "Guardando..." : "Guardar cambios"}</Button><Button asChild type="button" variant="secondary"><Link to="/settings">Configuración</Link></Button><Button type="button" variant="ghost" onClick={logout}><LogOut className="mr-2 size-4"/>Cerrar sesión</Button></div>
      </form>
    </Section>
  </div>;
}
