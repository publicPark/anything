"use client";

import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const typeStyles = {
    success: {
      backgroundColor: "var(--success-100)",
      color: "var(--success-800)",
    },
    error: {
      backgroundColor: "var(--error-100)",
      color: "var(--error-800)",
    },
    info: {
      backgroundColor: "var(--info-100)",
      color: "var(--info-800)",
    },
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-all duration-300"
      style={typeStyles[type]}
    >
      <div className="flex items-center space-x-2">
        <span>{message}</span>
        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="ml-2 opacity-80 hover:opacity-60 transition-opacity"
          style={{ color: "var(--foreground)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info";
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Toast 관리 훅
export function useToast() {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: "success" | "error" | "info";
    }>
  >([]);

  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
  };
}
