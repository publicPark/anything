"use client";

import { ReactNode } from "react";

export type StatusBadgeTone = "success" | "destructive" | "info" | "warning" | "neutral";

interface StatusBadgeProps {
  label: ReactNode;
  tone?: StatusBadgeTone;
  blinking?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  label,
  tone = "neutral",
  blinking = false,
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  const base = "inline-flex items-center rounded-full font-medium";
  const sizeClass = size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-1.5 text-base";

  const toneClass = (() => {
    switch (tone) {
      case "success":
        return "bg-success-600 text-success-foreground";
      case "destructive":
        return "bg-destructive text-destructive-foreground";
      case "info":
        return "bg-info/20 text-info-700";
      case "warning":
        return "bg-warning/20 text-warning-700";
      default:
        return "bg-muted text-foreground";
    }
  })();

  const blinkClass = blinking ? "animate-pulse" : "";

  return (
    <span className={[base, toneClass, blinkClass, className].filter(Boolean).join(" ")}>
      {label}
    </span>
  );
}

export default StatusBadge;


