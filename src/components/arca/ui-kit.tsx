import { Link } from "@/lib/router";
import { ArrowLeft, CheckCircle2, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action, back }: { eyebrow: string; title: string; description?: string; action?: ReactNode; back?: ReactNode }) {
  return <div>{back}<div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4", back && "mt-4")}><div className="min-w-0"><p className="text-xs font-semibold uppercase text-accent">{eyebrow}</p><h1 className="mt-1 font-display text-3xl font-semibold">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>{action}</div></div>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BackButton({ children, ...link }: { children: ReactNode; to: string; params?: Record<string, string> }) {
  const AnyLink = Link as any;
  return <Button asChild variant="ghost" size="sm"><AnyLink {...link}><ArrowLeft className="size-4" />{children}</AnyLink></Button>;
}

const control = "mt-1.5 w-full rounded-md border border-border bg-surface-raised/70 px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("block text-xs font-semibold text-muted-foreground", className)}>{label}{children}</label>;
}
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={cn(control, props.className)} />; }
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={cn(control, "min-h-20", props.className)} />; }
export function SelectInput({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) { return <select {...props} className={cn(control, props.className)}>{options.map((option) => <option key={option}>{option}</option>)}</select>; }

export function SearchBox({ value, onChange, placeholder, className }: { value: string; onChange: (value: string) => void; placeholder: string; className?: string }) {
  return <label className={cn("flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2", className)}><Search className="size-4 shrink-0 text-muted-foreground" /><input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>;
}

export function SuccessPanel({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <section role="status" className="mx-auto max-w-xl rounded-lg border border-border bg-card/75 p-8 text-center shadow-clinical backdrop-blur-md"><span className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent"><CheckCircle2 className="size-7" /></span><h2 className="mt-4 font-display text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}</section>;
}

export function StatusPill({ children }: { children: ReactNode }) {
  const text = String(children);
  const tone = /complet|disponible|asignad|mejorando/i.test(text) ? "bg-accent-soft text-accent" : /pendiente|ajuste|actualizar/i.test(text) ? "bg-priority-high text-priority-high-foreground" : "bg-primary-soft text-primary";
  return <span className={cn("inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>{children}</span>;
}

export function Initials({ children }: { children: ReactNode }) { return <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{children}</span>; }

/** Tabla con scroll horizontal en pantallas pequeñas. */
export function DataTable({ head, children, minWidth = 760 }: { head: string[]; children: ReactNode; minWidth?: number }) {
  return <div className="mt-4 overflow-x-auto"><table style={{ minWidth }} className="w-full text-left text-sm"><thead className="border-b border-border text-[11px] uppercase text-muted-foreground"><tr>{head.map((item, index) => <th key={index} className="pb-3 pr-3 font-semibold">{item}</th>)}</tr></thead><tbody className="divide-y divide-border [&_td]:py-3 [&_td]:pr-3">{children}</tbody></table></div>;
}
