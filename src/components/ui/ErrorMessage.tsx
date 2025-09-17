import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  className?: string;
  variant?: "default" | "destructive" | "success";
}

export function ErrorMessage({
  message,
  className,
  variant = "default",
}: ErrorMessageProps) {
  const variantClasses = {
    default: "bg-muted text-muted-foreground border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-success-100 text-success-800 border-success-600",
  };

  return (
    <div
      className={cn(
        "p-3 rounded-md text-sm border",
        variantClasses[variant],
        className
      )}
    >
      {message}
    </div>
  );
}
