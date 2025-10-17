"use client";

import { useI18n } from "@/hooks/useI18n";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsForm() {
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

    // Ensure the path is valid
    if (newPath === `/${newLocale}` || newPath === `/${newLocale}/`) {
      router.replace(`/${newLocale}`);
    } else {
      router.replace(newPath);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          {t("settings.title")}
        </h1>

        <div className="space-y-6">
          {/* Language Settings Card */}
          <div className="bg-muted rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t("settings.language")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("settings.languageDescription")}
            </p>

            <div className="space-y-3">
              {locales.map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                    locale === lang
                      ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                      : "bg-input border-border text-foreground hover:bg-muted"
                  }`}
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

          {/* Appearance Settings Card */}
          <div className="bg-muted rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t("settings.appearance")}
            </h2>
            <p className="text-muted-foreground mb-4">
              {t("settings.appearanceDescription")}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setTheme("light")}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  theme === "light"
                    ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                    : "bg-input border-border text-foreground hover:bg-muted"
                }`}
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
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  theme === "dark"
                    ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                    : "bg-input border-border text-foreground hover:bg-muted"
                }`}
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
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  theme === "system"
                    ? "bg-primary/20 border-primary/40 text-foreground shadow-sm"
                    : "bg-input border-border text-foreground hover:bg-muted"
                }`}
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

        {/* Go Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="bg-secondary text-secondary-foreground py-2 px-6 rounded-md hover:bg-secondary-hover active:bg-secondary-active transition-colors"
          >
            {t("settings.goBack")}
          </button>
        </div>
      </div>
    </div>
  );
}
