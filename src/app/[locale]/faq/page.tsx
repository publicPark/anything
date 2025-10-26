"use client";

import { useI18n } from "@/hooks/useI18n";
import { faqData } from "@/data/faq";

export default function FaqPage() {
  const { locale } = useI18n();
  const data = faqData[locale as keyof typeof faqData] || faqData.ko;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {data.title}
        </h1>

        <div className="space-y-6">
          {data.items.map((item, index) => (
            <div
              key={index}
              className="border-b border-border pb-4 last:border-b-0"
            >
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {item.question}
              </h2>
              <div
                className="text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
