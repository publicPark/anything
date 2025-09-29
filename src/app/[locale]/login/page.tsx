import { Metadata } from "next";
import { Suspense } from "react";
import { generateMetadata as generateI18nMetadata } from "@/lib/metadata-helpers";
import { Locale } from "@/lib/i18n";
import LoginForm from "./LoginForm";
import { SuspenseLoading } from "@/components/ui/SuspenseLoading";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateI18nMetadata(locale as Locale, "/login");
}

export default function LoginPage() {
  return (
    <Suspense fallback={<SuspenseLoading />}>
      <LoginForm />
    </Suspense>
  );
}
