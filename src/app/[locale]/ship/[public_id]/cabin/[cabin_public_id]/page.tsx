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
  reservations: CabinReservation[];
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
  shipPublicId: string,
  cabinPublicId: string,
  userId?: string
): Promise<CabinDetailData> {
  const supabase = await createClient();
  
  try {
    // 1단계: 배와 선실 정보 조회
    const [shipResult, cabinResult] = await Promise.all([
      supabase
        .from("ships")
        .select("*")
        .eq("public_id", shipPublicId)
        .maybeSingle(),
      supabase
        .from("ship_cabins")
        .select("*")
        .eq("public_id", cabinPublicId)
        .maybeSingle(),
    ]);

    if (shipResult.error) throw shipResult.error;
    if (cabinResult.error) throw cabinResult.error;

    const shipData = shipResult.data;
    const cabinData = cabinResult.data;

    if (!shipData || !cabinData) {
      return { ship: null, cabin: null, reservations: [], userRole: null };
    }

    // 선실이 해당 배에 속하는지 확인
    if (cabinData.ship_id !== shipData.id) {
      return { ship: null, cabin: null, reservations: [], userRole: null };
    }

    // 2단계: 예약 목록과 사용자 역할 조회
    const [reservationsResult, memberResult] = await Promise.all([
      supabase
        .from("cabin_reservations")
        .select("*")
        .eq("cabin_id", cabinData.id)
        .eq("status", "confirmed")
        .order("start_time", { ascending: true }),
      userId
        ? supabase
            .from("ship_members")
            .select("role")
            .eq("ship_id", shipData.id)
            .eq("user_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (reservationsResult.error) throw reservationsResult.error;

    return {
      ship: shipData,
      cabin: cabinData,
      reservations: reservationsResult.data || [],
      userRole: memberResult.data?.role || null,
    };
  } catch (error) {
    console.error("Failed to fetch cabin detail data:", error);
    return { ship: null, cabin: null, reservations: [], userRole: null };
  }
}

export default async function CabinDetailPage({
  params,
}: CabinDetailPageProps) {
  const { locale, public_id, cabin_public_id } = await params;

  // 멤버 전용 배 권한 체크 (공통 함수 사용)
  await checkShipMemberAccess(public_id, locale);

  // 서버에서 캐빈 데이터 미리 가져오기
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const cabinData = await fetchCabinDetailData(
    public_id,
    cabin_public_id,
    user?.id
  );

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
