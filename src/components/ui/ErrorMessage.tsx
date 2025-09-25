import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: "default" | "destructive" | "success";
  onClose?: () => void;
}

export function ErrorMessage({
  message,
  className,
  variant = "default",
  onClose,
}: ErrorMessageProps) {
  const { t } = useI18n();
  const variantClasses = {
    default: "bg-muted text-muted-foreground border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-muted text-success-800 border-success-600",
  };

  return (
    <div
      className={cn(
        "p-3 rounded-md text-sm border flex items-center justify-between",
        variantClasses[variant],
        className
      )}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label={t("common.close")}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
