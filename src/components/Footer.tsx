"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import LanguageSettingsModal from "./LanguageSettingsModal";

export function Footer() {
  const { t, locale } = useI18n();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2025 Reservation System
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {t("settings.title")}
            </button>
            <Link
              href={`/${locale}/about`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("footer.about")}
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

      {/* 설정 모달 */}
      <LanguageSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </footer>
  );
}
