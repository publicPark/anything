"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/hooks/useI18n";

const CONSENT_COOKIE = "cookie_consent";

export default function CookieConsent() {
  const { t, locale } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try {
      document.cookie = `${CONSENT_COOKIE}=accepted; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    } catch {}
    setVisible(false);
  };

  const decline = () => {
    try {
      document.cookie = `${CONSENT_COOKIE}=declined; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    } catch {}
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-background text-card-foreground border border-border rounded-lg shadow-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm sm:text-base">
            <strong>{t("cookie.title")}</strong>
            <div className="text-muted-foreground mt-1 whitespace-pre-line">
              {t("cookie.message")}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 justify-end">
            <button
              onClick={decline}
              className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted"
            >
              {t("cookie.decline")}
            </button>
            <button
              onClick={accept}
              className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("cookie.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
