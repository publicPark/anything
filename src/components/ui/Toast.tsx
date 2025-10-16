"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  const variantClass = useMemo(() => {
    switch (type) {
      case "success":
        return "bg-emerald-100 text-emerald-900 border-emerald-200";
      case "error":
        return "bg-red-100 text-red-900 border-red-200";
      default:
        return "bg-blue-100 text-blue-900 border-blue-200";
    }
  }, [type]);

  useEffect(() => {
    if (hovered) return;
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration) as unknown as number;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [duration, onClose, hovered]);

  if (!visible) return null;

  const icon = type === "success" ? "✓" : type === "error" ? "⚠" : "i";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`w-[320px] max-w-[90vw] rounded-md shadow-lg border ${variantClass} transition-all duration-200`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span aria-hidden className="mt-0.5 select-none">
          {icon}
        </span>
        <span className="flex-1 text-sm leading-5">{message}</span>
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="shrink-0 rounded p-1/2 text-current/70 hover:text-current/100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function ToastContainer({
  toasts,
  onRemove,
  position = "top-right",
}: ToastContainerProps) {
  const posClass =
    position === "top-right"
      ? "top-4 right-4"
      : position === "top-left"
      ? "top-4 left-4"
      : position === "bottom-right"
      ? "bottom-4 right-4"
      : "bottom-4 left-4";

  return (
    <div
      className={`fixed ${posClass} z-50 space-y-2`}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Toast 관리 훅
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = (message: string, type: ToastType = "info", duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    add,
    remove,
    success: (message: string, duration?: number) =>
      add(message, "success", duration),
    error: (message: string, duration?: number) =>
      add(message, "error", duration),
    info: (message: string, duration?: number) =>
      add(message, "info", duration),
  };
}
