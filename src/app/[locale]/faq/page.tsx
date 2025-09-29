"use client";

import { useI18n } from "@/hooks/useI18n";

export default function FaqPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t("faq.title")}
        </h1>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("faq.q1")}
            </h2>
            <p className="text-muted-foreground mt-2">{t("faq.a1")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
