export type ToastOptions = { description?: string };
export type ToastEvent = { title: string; description?: string; success?: boolean };
export const toast = Object.assign(
  (title: string, options?: ToastOptions) => { window.dispatchEvent(new CustomEvent("arca-toast", { detail: { title, description: options?.description } })); },
  { success: (title: string, options?: ToastOptions) => { window.dispatchEvent(new CustomEvent("arca-toast", { detail: { title, description: options?.description, success: true } })); } },
);
