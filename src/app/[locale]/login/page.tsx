import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateMetadata as generateI18nMetadata } from "@/lib/metadata-helpers";
import { Locale, getTranslations } from "@/lib/i18n";
import LoginForm from "./LoginForm";
import { SuspenseLoading } from "@/components/ui/SuspenseLoading";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateI18nMetadata(locale as Locale, "/login");
}

export default async function LoginPage({ 
  params, 
  searchParams 
}: LoginPageProps) {
  const { locale } = await params;
  const translations = getTranslations(locale as Locale);
  
  return (
    <div className="min-h-[calc(100vh-8rem)] flex justify-center pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-foreground">
            {translations.login.title}
          </h2>
        </div>
        <Suspense fallback={
          <div className="mt-8 flex justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
              <div className="text-sm text-muted-foreground">
                {translations.common.loading}
              </div>
            </div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
