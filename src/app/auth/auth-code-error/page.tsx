"use client";

import { useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LOCALIZED_MESSAGES } from "@/lib/locale-helpers";

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") || `/${locale}/`;

  const getErrorMessage = () => {
    // Handle specific error types
    if (error === "server_error" && errorCode === "unexpected_failure") {
      return LOCALIZED_MESSAGES.auth.serverError(locale);
    }

    if (error === "exchange_error") {
      return LOCALIZED_MESSAGES.auth.exchangeError(locale);
    }

    if (error === "missing_code") {
      return LOCALIZED_MESSAGES.auth.missingCode(locale);
    }

    // Use error description if available
    if (errorDescription) {
      return decodeURIComponent(errorDescription);
    }

    // Default error message
    return LOCALIZED_MESSAGES.auth.defaultError(locale);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto h-12 w-12 text-destructive">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            {locale === "en" ? "Authentication Error" : "인증 오류"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {getErrorMessage()}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Link href={`/${locale}/login`}>
              <Button className="w-full">
                {LOCALIZED_MESSAGES.ui.tryAgain(locale)}
              </Button>
            </Link>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  {LOCALIZED_MESSAGES.ui.or(locale)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link href={`/${locale}/`}>
                <Button variant="secondary" className="w-full">
                  {LOCALIZED_MESSAGES.ui.goHome(locale)}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {LOCALIZED_MESSAGES.support.contactSupport(locale)}
          </p>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Debug Information:
            </h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Error: {error || "N/A"}</div>
              <div>Error Code: {errorCode || "N/A"}</div>
              <div>Error Description: {errorDescription || "N/A"}</div>
              <div>Next: {next}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
