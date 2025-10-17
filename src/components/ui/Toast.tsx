"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "info" | "default";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 진입 애니메이션 완료
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const variantClass = useMemo(() => {
    switch (type) {
      case "success":
        return "bg-[var(--success-100)] text-[var(--foreground)] border-[var(--success-600)]";
      case "error":
        return "bg-[var(--error-100)] text-[var(--foreground)] border-[var(--error-600)]";
      case "info":
        return "bg-[var(--info-100)] text-[var(--foreground)] border-[var(--info-600)]";
      case "default":
        return "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]";
      default:
        return "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]";
    }
  }, [type]);

  useEffect(() => {
    if (hovered) return;
    timerRef.current = window.setTimeout(() => {
      setIsExiting(true);
      // 애니메이션 완료 후 실제 제거
      setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 300); // 애니메이션 duration과 맞춤
    }, duration) as unknown as number;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [duration, onClose, hovered]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300);
  };

  const icon = useMemo(() => {
    switch (type) {
      case "success":
        return (
          <svg
            className="w-5 h-5"
            fill="var(--success-600)"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5" fill="var(--error-600)" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "info":
        return (
          <svg className="w-5 h-5" fill="var(--info-600)" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "default":
        return null;
      default:
        return null;
    }
  }, [type]);

  if (!visible) return null;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`w-[320px] max-w-[90vw] rounded-md shadow-lg border ${variantClass} transform transition-all duration-300 ease-out ${
        isExiting
          ? "translate-x-full opacity-0 scale-95"
          : isEntering
          ? "translate-x-full opacity-0 scale-95"
          : "translate-x-0 opacity-100 scale-100"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {icon && (
          <span
            aria-hidden
            className="select-none flex-shrink-0 w-5 h-5 flex items-center justify-center"
          >
            {icon}
          </span>
        )}
        <span className="flex-1 text-sm leading-5">{message}</span>
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="shrink-0 rounded p-1/2 text-current/70 hover:text-current/100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
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
      className={`fixed ${posClass} z-50 space-y-2 pointer-events-none`}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Toast Context

interface ToastContextType {
  toasts: ToastItem[];
  add: (message: string, type?: ToastType, duration?: number) => string;
  remove: (id: string) => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  default: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = (message: string, type: ToastType = "info", duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const contextValue: ToastContextType = {
    toasts,
    add,
    remove,
    success: (message: string, duration?: number) =>
      add(message, "success", duration),
    error: (message: string, duration?: number) =>
      add(message, "error", duration),
    info: (message: string, duration?: number) =>
      add(message, "info", duration),
    default: (message: string, duration?: number) =>
      add(message, "default", duration),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastContainer toasts={toasts} onRemove={remove} />
      {children}
    </ToastContext.Provider>
  );
}

// Toast 관리 훅
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
