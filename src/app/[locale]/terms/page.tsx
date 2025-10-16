"use client";

import { useI18n } from "@/hooks/useI18n";

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("legal.terms.title")}
        </h1>
        <div className="text-sm text-muted-foreground mb-6">
          {t("legal.terms.updated")}: 2025-10-16
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-foreground whitespace-pre-line">
            {t("legal.terms.content")}
          </p>
        </div>
      </div>
    </div>
  );
}
