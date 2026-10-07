import {
  BrainCircuit,
  ChevronRight,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/arca-data";

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card/75 p-4 shadow-clinical backdrop-blur-md sm:p-5",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "brand" | "accent" | "attention";
}) {
  return (
    <article className="rounded-lg border border-border bg-card/75 p-4 shadow-clinical backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "grid size-8 place-items-center rounded-md",
            tone === "accent"
              ? "bg-accent-soft text-accent"
              : tone === "attention"
                ? "bg-priority-high text-priority-high-foreground"
                : "bg-primary-soft text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-3xl font-semibold leading-none">{value}</p>
        <p className="text-right text-[11px] font-medium text-muted-foreground">
          {detail}
        </p>
      </div>
    </article>
  );
}

export function TriageBadge({ priority }: { priority: Priority }) {
  const labels = { High: "Alta", Medium: "Media", Low: "Baja" };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
        priority === "High" &&
          "bg-priority-high text-priority-high-foreground ring-priority-high-border",
        priority === "Medium" &&
          "bg-priority-medium text-priority-medium-foreground ring-priority-medium-border",
        priority === "Low" &&
          "bg-priority-low text-priority-low-foreground ring-priority-low-border",
      )}
    >
      {labels[priority]}
    </span>
  );
}

export function RomChart({
  data,
  height = 220,
}: {
  data: { date: string; value: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="mt-4 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[40, 90]}
            tickFormatter={(v) => `${v}°`}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderColor: "var(--border)",
              borderRadius: 6,
              background: "var(--popover)",
              fontSize: 12,
            }}
            formatter={(value) => [`${value}°`, "Flexión"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={{
              fill: "var(--card)",
              stroke: "var(--accent)",
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClinicalSummary() {
  return (
    <Section
      title="Resumen clínico"
      description="Resumen estructurado según la información disponible del paciente"
      action={
        <span className="flex items-center gap-1 rounded-full bg-ai-soft px-2 py-1 text-[10px] font-semibold text-ai">
          <BrainCircuit className="size-3" />
          Generado por IA
        </span>
      }
    >
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          [
            "Contexto del paciente",
            "Paciente de 54 años con dolor progresivo en la rodilla izquierda que afecta escaleras y caminatas prolongadas.",
          ],
          [
            "Síntomas principales",
            "Dolor en la línea articular medial, rigidez matinal menor a 20 minutos e hinchazón intermitente.",
          ],
          [
            "Hallazgos relevantes",
            "Flexión limitada a 78°, derrame leve y menor activación del cuádriceps.",
          ],
          [
            "Evolución previa",
            "El rango de movimiento mejoró 26° en seis semanas, con menor dolor en reposo.",
          ],
        ].map(([title, text]) => (
          <div key={title}>
            <h3 className="text-xs font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-ai-border bg-ai-soft/60 p-3 text-xs leading-5 text-muted-foreground">
        <strong className="text-foreground">Revisión obligatoria:</strong> Este
        contenido generado por IA apoya la revisión clínica y no sustituye el
        criterio profesional.
      </div>
    </Section>
  );
}

export function Metric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-raised/60 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-xl font-semibold">{value}</p>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-semibold text-accent">
            <TrendingUp className="size-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function RowAction({
  children = "Revisar",
}: {
  children?: React.ReactNode;
}) {
  return (
    <Button variant="secondary" size="sm">
      {children}
      <ChevronRight className="size-3.5" />
    </Button>
  );
}
