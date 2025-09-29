import { Metadata } from "next";
import { Suspense } from "react";
import AuthCodeErrorForm from "./AuthCodeErrorForm";
import { SuspenseLoading } from "@/components/ui/SuspenseLoading";

interface AuthCodeErrorPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: AuthCodeErrorPageProps): Promise<Metadata> {
  const { locale } = await params;

  const title =
    locale === "ko"
      ? "인증 오류 - 예약시스템"
      : "Authentication Error - Reservation System";

  const description =
    locale === "ko"
      ? "인증 과정에서 오류가 발생했습니다."
      : "An error occurred during authentication.";

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={<SuspenseLoading />}>
      <AuthCodeErrorForm />
    </Suspense>
  );
}
