import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, Locale } from "@/lib/i18n";
import { checkShipMemberAccess } from "@/lib/auth/ship-auth";
import { CabinDetailContent } from "@/components/CabinDetailContent";
import { Ship, ShipCabin, CabinReservation } from "@/types/database";

interface CabinDetailPageProps {
  params: Promise<{
    locale: string;
    public_id: string;
    cabin_public_id: string;
  }>;
}

interface CabinDetailData {
  ship: Ship | null;
  cabin: ShipCabin | null;
  userRole: "captain" | "mechanic" | "crew" | null;
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

// 서버에서 캐빈 데이터를 가져오는 함수
async function fetchCabinDetailData(
  shipData: Ship | null,
  cabinPublicId: string
): Promise<CabinDetailData> {
  const supabase = await createClient();
  
  try {
    if (!shipData) {
      return { ship: null, cabin: null, userRole: null };
    }

    // 선실 정보만 조회 (배 정보는 이미 있음)
    const { data: cabinData, error: cabinError } = await supabase
      .from("ship_cabins")
      .select("*")
      .eq("public_id", cabinPublicId)
      .maybeSingle();

    if (cabinError) throw cabinError;

    if (!cabinData) {
      return { ship: null, cabin: null, userRole: null };
    }

    // 선실이 해당 배에 속하는지 확인
    if (cabinData.ship_id !== shipData.id) {
      return { ship: null, cabin: null, userRole: null };
    }

    // 예약 조회는 클라이언트 사이드에서만 수행
    return {
      ship: shipData,
      cabin: cabinData,
      userRole: null,
    };
  } catch (error) {
    console.error("Failed to fetch cabin detail data:", error);
    return { ship: null, cabin: null, userRole: null };
  }
}

export default async function CabinDetailPage({
  params,
}: CabinDetailPageProps) {
  const { locale, public_id, cabin_public_id } = await params;

  // 멤버 전용 배 권한 체크 및 배 정보 가져오기
  const shipData = await checkShipMemberAccess(public_id, locale);

  // 서버에서 캐빈 데이터 미리 가져오기 (예약과 멤버십 정보는 클라이언트에서 나중에 로드)
  const cabinData = await fetchCabinDetailData(shipData, cabin_public_id);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <CabinDetailContent
        shipPublicId={public_id}
        cabinPublicId={cabin_public_id}
        showBreadcrumb={true}
        preloadedData={cabinData}
      />
    </div>
  );
}
