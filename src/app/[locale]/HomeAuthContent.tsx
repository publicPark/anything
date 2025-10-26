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
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-8 gap-6 items-start">
          <div className="md:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
              </div>
              <div className="flex justify-center">
                <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
              </div>
              <div className="text-center py-12">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
                  <div className="h-4 bg-muted rounded w-24 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="h-8 bg-muted rounded w-40 animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-20 bg-muted rounded animate-pulse"></div>
                <div className="h-20 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t("home.errorTitle")}
          </h1>
          <ErrorMessage
            message={error}
            variant="destructive"
            className="mb-6"
          />
          <div className="space-y-4 max-w-md mx-auto">
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
