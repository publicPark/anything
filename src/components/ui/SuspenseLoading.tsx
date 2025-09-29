"use client";

import { LoadingSpinner } from "./LoadingSpinner";
import { useI18n } from "@/hooks/useI18n";

interface SuspenseLoadingProps {
  className?: string;
}

export function SuspenseLoading({ className }: SuspenseLoadingProps) {
  const { t } = useI18n();

  return (
    <div
      className={`min-h-screen bg-background flex items-center justify-center p-4 ${
        className || ""
      }`}
    >
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto" />
        <div className="text-lg text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    </div>
  );
}
