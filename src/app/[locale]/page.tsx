"use client";

import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/hooks/useI18n";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { MyShips } from "@/components/MyShips";
import { MyReservations } from "@/components/MyReservations";

export default function Home() {
  const { profile, loading, error } = useProfile();
  const { t, locale } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="sr-only">홈</h1>
          <h3 className="text-xl font-medium mb-8">
            {profile
              ? t("home.welcome", {
                  name: profile.display_name || profile.username,
                })
              : t("home.welcomeMessage")}
          </h3>

          {profile ? (
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
          ) : (
            <div className="bg-muted rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("home.subtitle")}
              </h2>
              <p className="text-muted-foreground mb-6 whitespace-pre-line">
                {t("home.subdescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const currentPath = window.location.pathname;
                    window.location.href = `/${locale}/login?next=${encodeURIComponent(
                      currentPath
                    )}`;
                  }}
                  className="flex-1"
                >
                  {t("home.goToLogin")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    window.location.href = `/${locale}/ship/SHIP000003`;
                  }}
                  className="flex-1"
                >
                  {t("home.tutorial")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
