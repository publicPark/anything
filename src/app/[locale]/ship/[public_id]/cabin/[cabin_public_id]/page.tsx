import { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, Locale } from "@/lib/i18n";
import { checkShipMemberAccess } from "@/lib/auth/ship-auth";
import CabinDetail from "./CabinDetail";
import { SuspenseLoading } from "@/components/ui/SuspenseLoading";

interface CabinDetailPageProps {
  params: Promise<{
    locale: string;
    public_id: string;
    cabin_public_id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CabinDetailPageProps): Promise<Metadata> {
  const { locale, public_id, cabin_public_id } = await params;
  const supabase = await createClient();
  const t = getTranslations(locale as Locale);

  try {
    // 배 정보를 별도로 조회하여 타입 안전성 확보
    const { data: shipData, error: shipError } = await supabase
      .from("ships")
      .select("name")
      .eq("public_id", public_id)
      .single();

    const { data: cabin, error: cabinError } = await supabase
      .from("ship_cabins")
      .select("name")
      .eq("public_id", cabin_public_id)
      .single();

    if (cabinError || !cabin || shipError || !shipData) {
      return {
        title: `${t.cabin.notFoundTitle} - ${t.metadata.title}`,
        description: t.cabin.notFoundDescription,
      };
    }

    const shipName = shipData.name || "Unknown Ship";

    const title = `${cabin.name} - ${shipName} - ${t.metadata.title}`;
    const description = t.cabin.cabinDetailDescription
      .replace("{shipName}", shipName)
      .replace("{cabinName}", cabin.name);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        locale: locale === "ko" ? "ko_KR" : "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: `${t.cabin.notFoundTitle} - ${t.metadata.title}`,
      description: t.cabin.notFoundDescription,
    };
  }
}

export default async function CabinDetailPage({
  params,
}: CabinDetailPageProps) {
  const { locale, public_id, cabin_public_id } = await params;

  // 멤버 전용 배 권한 체크 (공통 함수 사용)
  await checkShipMemberAccess(public_id, locale);

  return (
    <Suspense fallback={<SuspenseLoading />}>
      <CabinDetail />
    </Suspense>
  );
}
