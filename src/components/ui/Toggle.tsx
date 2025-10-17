"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary border-primary" : "bg-muted border-border",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform transition-colors border border-border",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
