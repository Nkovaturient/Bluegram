"use client";

import { useCallback, useState } from "react";

export type ToastVariant = "success" | "info" | "error";

export type ToastMessage = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const badgeColor =
          toast.variant === "success"
            ? "border-emerald-400/40 bg-[#081518]/95 text-emerald-200"
            : toast.variant === "error"
              ? "border-red-400/45 bg-[#1a0c10]/95 text-red-200"
              : "border-white/15 bg-[#0b1420]/95 text-slate-100";

        const dotColor =
          toast.variant === "success"
            ? "bg-emerald-400"
            : toast.variant === "error"
              ? "bg-red-400"
              : "bg-primary";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium shadow-glass backdrop-blur-md animate-slide-in ${badgeColor}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="ml-1 rounded p-0.5 text-slate-400 transition-colors hover:text-white"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
