import { notFound } from "next/navigation";
import { Metadata } from "next";
import { locales, Locale } from "@/lib/i18n";
import { generateMetadata as generateI18nMetadata } from "@/lib/metadata-helpers";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Get the current path from the URL
  // This is a simplified approach - in a real app you might want to pass the path differently
  return generateI18nMetadata(locale as Locale);
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as "ko" | "en")) {
    notFound();
  }

  return <>{children}</>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}
