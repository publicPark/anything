"use client";

import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/hooks/useI18n";
import { MyShips } from "@/components/MyShips";
import { MyReservations } from "@/components/MyReservations";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";

export function HomeAuthContent() {
  const { profile, loading, error } = useProfile();
  const { t, locale } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-24 mx-auto"></div>
          </div>
          <div className="text-lg text-muted-foreground mt-4">
            {t("home.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t("home.errorTitle")}
            </h1>
            <ErrorMessage
              message={error}
              variant="destructive"
              className="mb-6"
            />
            <div className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t("home.retry")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const currentPath = window.location.pathname;
                  window.location.href = `/${locale}/login?next=${encodeURIComponent(
                    currentPath
                  )}`;
                }}
                className="w-full"
              >
                {t("home.goToLogin")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-4 md:gap-8 gap-6 items-start">
        <div className="md:col-span-2">
          <MyShips />
        </div>
        <div className="md:col-span-2">
          <MyReservations />
        </div>
      </div>
    </div>
  );
}
