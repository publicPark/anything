import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, Locale } from "@/lib/i18n";
import { checkShipMemberAccess } from "@/lib/auth/ship-auth";
import { ShipCabinsContent } from "./ShipCabinsContent";
import { Ship } from "@/types/database";
import {
  CabinWithStatus,
  addStatusToCabins,
  groupReservationsByCabinId,
} from "@/lib/cabin-status";

interface ShipCabinsPageProps {
  params: Promise<{ locale: string; public_id: string }>;
}

interface ShipCabinsData {
  ship: Ship | null;
  cabins: CabinWithStatus[];
  userRole: "captain" | "mechanic" | "crew" | null;
}

export async function generateMetadata({
  params,
}: ShipCabinsPageProps): Promise<Metadata> {
  const { locale, public_id } = await params;
  const supabase = await createClient();
  const t = getTranslations(locale as Locale);

  try {
    const { data: ship, error } = await supabase
      .from("ships")
      .select("name")
      .eq("public_id", public_id)
      .single();

    if (error || !ship) {
      return {
        title: `${t.ship.notFoundTitle} - ${t.metadata.title}`,
        description: t.ship.notFoundDescription,
      };
    }

    const title = `${ship.name} - ${t.ship.cabinsTitle} - ${t.metadata.title}`;
    const description = t.ship.shipCabinsDescription.replace(
      "{shipName}",
      ship.name
    );

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

// 서버에서 캐빈 데이터를 가져오는 함수
async function fetchShipCabinsData(
  shipPublicId: string,
  userId?: string
): Promise<ShipCabinsData> {
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
      return { ship: null, cabins: [], userRole: null };
    }

    // 2단계: 캐빈 목록과 예약 정보, 사용자 역할을 병렬로 조회
    const [cabinsResult, reservationsResult, memberResult] = await Promise.all([
      supabase
        .from("ship_cabins")
        .select("*")
        .eq("ship_id", shipData.id)
        .order("name", { ascending: true }),
      supabase
        .from("cabin_reservations")
        .select("*")
        .eq("status", "confirmed")
        .gte("start_time", new Date().toISOString().split('T')[0])
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

    if (cabinsResult.error) throw cabinsResult.error;
    if (reservationsResult.error) throw reservationsResult.error;

    const cabins = cabinsResult.data || [];
    const reservations = reservationsResult.data || [];

    // 3단계: 캐빈에 상태 정보 추가
    const reservationsByCabinId = groupReservationsByCabinId(reservations);
    const cabinsWithStatus = addStatusToCabins(cabins, reservationsByCabinId);

    return {
      ship: shipData,
      cabins: cabinsWithStatus,
      userRole: memberResult.data?.role || null,
    };
  } catch (error) {
    console.error("Failed to fetch ship cabins data:", error);
    return { ship: null, cabins: [], userRole: null };
  }
}

export default async function ShipCabinsPage({ params }: ShipCabinsPageProps) {
  const { locale, public_id } = await params;

  // 멤버 전용 배 권한 체크
  await checkShipMemberAccess(public_id, locale);

  // 서버에서 캐빈 데이터 미리 가져오기
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const cabinsData = await fetchShipCabinsData(public_id, user?.id);

  return (
    <ShipCabinsContent
      shipPublicId={public_id}
      preloadedData={cabinsData}
    />
  );
}
