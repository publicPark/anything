"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";

export function Footer() {
  const { t, locale } = useI18n();

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2025 Reservation System
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href={`/${locale}/settings`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("settings.title")}
            </Link>
            <Link
              href={`/${locale}/faq`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.faq")}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
