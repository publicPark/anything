"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";

export default function NotFoundForm() {
  const { locale } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          {locale === "en" ? "Page Not Found" : "페이지를 찾을 수 없습니다"}
        </h2>
        <p className="text-muted-foreground mb-8">
          {locale === "en"
            ? "The page you are looking for does not exist."
            : "요청하신 페이지를 찾을 수 없습니다."}
        </p>
        <Link
          href={`/${locale}/`}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover active:bg-primary-active focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        >
          {locale === "en" ? "Go Home" : "홈으로 돌아가기"}
        </Link>
      </div>
    </div>
  );
}
