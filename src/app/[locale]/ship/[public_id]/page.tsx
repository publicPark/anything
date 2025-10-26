import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, Locale } from "@/lib/i18n";
import { ShipDetailContent } from "./ShipDetailContent";
import { Ship } from "@/types/database";

interface ShipDetailPageProps {
  params: Promise<{ locale: string; public_id: string }>;
}

interface ShipDetailData {
  ship: Ship | null;
  userRole?: "captain" | "mechanic" | "crew" | null;
}

export async function generateMetadata({
  params,
}: ShipDetailPageProps): Promise<Metadata> {
  const { locale, public_id } = await params;
  const supabase = await createClient();
  const t = getTranslations(locale as Locale);

  try {
    const { data: ship, error } = await supabase
      .from("ships")
      .select("name, description")
      .eq("public_id", public_id)
      .single();

    if (error || !ship) {
      return {
        title: `${t.ship.notFoundTitle} - ${t.metadata.title}`,
        description: t.ship.notFoundDescription,
      };
    }

    const title = `${ship.name} - ${t.metadata.title}`;
    const description =
      ship.description ||
      t.ship.shipDetailDescription.replace("{shipName}", ship.name);

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
      title: `${t.ship.notFoundTitle} - ${t.metadata.title}`,
      description: t.ship.notFoundDescription,
    };
  }
}

// 서버에서 기본 배 정보를 가져오는 함수
async function fetchShipDetailData(
  shipPublicId: string,
  userId?: string
): Promise<ShipDetailData> {
  const supabase = await createClient();
  
  try {
    // 1단계: 배 정보 조회
    const { data: shipData, error: shipError } = await supabase
      .from("ships")
      .select("*")
      .eq("public_id", shipPublicId)
      .maybeSingle();

    if (shipError) throw shipError;
    if (!shipData) {
      return { ship: null, userRole: null };
    }

    // 2단계: 사용자 역할 조회 (로그인한 경우)
    let userRole: "captain" | "mechanic" | "crew" | null = null;
    if (userId) {
      const { data: memberData } = await supabase
        .from("ship_members")
        .select("role")
        .eq("ship_id", shipData.id)
        .eq("user_id", userId)
        .maybeSingle();
      
      userRole = memberData?.role || null;
    }

    return {
      ship: shipData,
      userRole,
    };
  } catch (error) {
    console.error("Failed to fetch ship detail data:", error);
    return { ship: null, userRole: null };
  }
}

export default async function ShipDetailPage({ params }: ShipDetailPageProps) {
  const { public_id } = await params;

  // 서버에서 기본 배 데이터 미리 가져오기
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const shipData = await fetchShipDetailData(public_id, user?.id);

  return (
    <ShipDetailContent
      shipPublicId={public_id}
      preloadedData={shipData}
    />
  );
}
