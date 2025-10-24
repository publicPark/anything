"use client";

import { useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface LanguageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSettingsModal({
  isOpen,
  onClose,
}: LanguageSettingsModalProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const getLanguageDisplay = (lang: string) => {
    switch (lang) {
      case "ko":
        return "한국어";
      case "en":
        return "English";
      default:
        return lang.toUpperCase();
    }
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case "ko":
        return "🇰🇷";
      case "en":
        return "🇺🇸";
      default:
        return "🌐";
    }
  };

  const switchLanguage = (newLocale: string) => {
    try {
      // Persist user preference for locale (1 year)
      // Note: Cookie will be read in middleware to keep locale consistent across navigation
      document.cookie = `preferred_locale=${newLocale}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
    } catch (err) {
      // Fail silently; navigation still updates the URL locale
    }

    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.replace(newPath);
  };

  // ESC 키로 모달 닫기 및 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 배경 스크롤 방지
      document.body.style.overflow = "hidden";
      
      // ESC 키 이벤트 리스너
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-background rounded-lg shadow-xl border border-border max-w-md w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {t("settings.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
            aria-label="모달 닫기"
          >
            <svg
              className="w-5 h-5"
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
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 언어 설정 */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("settings.language")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("settings.languageDescription")}
            </p>

            <div className="space-y-2">
              {locales.map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                    locale === lang
                      ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                      : "bg-input border-border text-foreground hover:bg-muted hover:border-border/60"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getLanguageFlag(lang)}</span>
                    <span className="font-medium">
                      {getLanguageDisplay(lang)}
                    </span>
                  </div>
                  {locale === lang && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 테마 설정 */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("settings.appearance")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("settings.appearanceDescription")}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                  theme === "light"
                    ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                    : "bg-input border-border text-foreground hover:bg-muted hover:border-border/60"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">☀️</span>
                  <span className="font-medium">{t("settings.lightMode")}</span>
                </div>
                {theme === "light" && (
                  <span className="text-primary font-bold">✓</span>
                )}
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                  theme === "dark"
                    ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                    : "bg-input border-border text-foreground hover:bg-muted hover:border-border/60"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🌙</span>
                  <span className="font-medium">{t("settings.darkMode")}</span>
                </div>
                {theme === "dark" && (
                  <span className="text-primary font-bold">✓</span>
                )}
              </button>

              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer",
                  theme === "system"
                    ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                    : "bg-input border-border text-foreground hover:bg-muted hover:border-border/60"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💻</span>
                  <span className="font-medium">
                    {t("settings.systemMode")}
                  </span>
                </div>
                {theme === "system" && (
                  <span className="text-primary font-bold">✓</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
