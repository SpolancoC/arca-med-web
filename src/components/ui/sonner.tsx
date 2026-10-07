import { useEffect, useState } from "react";
import type { ToastEvent } from "@/lib/toast";

export function Toaster() {
  const [item, setItem] = useState<ToastEvent | null>(null);
  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEvent>).detail;
      setItem(detail);
      window.setTimeout(() => setItem(null), 3200);
    };
    window.addEventListener("arca-toast", onToast);
    return () => window.removeEventListener("arca-toast", onToast);
  }, []);
  if (!item) return null;
  return <div className="fixed right-4 top-4 z-[100] w-[min(360px,calc(100vw-2rem))] rounded-lg border border-border bg-card p-4 shadow-lg">
    <p className="text-sm font-semibold">{item.title}</p>
    {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
  </div>;
}
