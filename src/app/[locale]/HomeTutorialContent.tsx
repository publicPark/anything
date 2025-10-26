import { createClient } from "@/lib/supabase/server";
import { getTranslations, t, Locale } from "@/lib/i18n";
import { CabinDetailContent } from "@/components/CabinDetailContent";
import { Ship, ShipCabin, CabinReservation } from "@/types/database";
import Link from "next/link";

interface HomeTutorialContentProps {
  locale: string;
  tutorialShipId: string;
}

interface TutorialCabinData {
  ship: Ship | null;
  cabin: ShipCabin | null;
  reservations: CabinReservation[];
}

export async function HomeTutorialContent({ 
  locale, 
  tutorialShipId
}: HomeTutorialContentProps) {
  const translate = (key: string) => t(key, locale as Locale);
  
  // 서버에서 캐빈 데이터 미리 가져오기
  const cabinData = await fetchTutorialCabinData(locale);

  return (
    <div className="max-w-4xl mx-auto mt-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {translate("home.tryReservation")}
        </h2>
        <Link 
          href={`/${locale}/ship/SPtest${locale}/cabin/${cabinData.cabin?.public_id || 'CABIN000006'}`}
          className="px-3 py-1.5 text-sm font-medium text-foreground bg-muted border border-border rounded-md hover:bg-muted/80 hover:border-border/60 transition-all inline-block"
        >
          {translate("home.cabinsPreview.viewAll")}
        </Link>
      </div>

      {/* Divider */}
      <hr className="border-border mb-8" />

      {/* Featured Cabin */}
      <div className="mb-6">
        <div className="bg-background">
          {cabinData.ship && cabinData.cabin ? (
            <CabinDetailContent
              shipPublicId={cabinData.ship.public_id}
              cabinPublicId={cabinData.cabin.public_id}
              tutorialMode={true}
              preloadedData={cabinData}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cabin not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 서버에서 캐빈 데이터를 가져오는 함수
async function fetchTutorialCabinData(locale: string): Promise<TutorialCabinData> {
  const supabase = await createClient();
  
  try {
    const shipPublicId = `SPtest${locale}`;
    const cabinPublicId = locale === "ko" ? "CABIN000006" : "CBF2E9BDF36B";

    // 배와 캐빈 정보를 병렬로 조회
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

    const ship = shipResult.data;
    const cabin = cabinResult.data;

    if (!ship || !cabin) {
      return { ship: null, cabin: null, reservations: [] };
    }

    // 캐빈이 해당 배에 속하는지 확인
    if (cabin.ship_id !== ship.id) {
      return { ship: null, cabin: null, reservations: [] };
    }

    // 예약 정보 조회
    const { data: reservations, error: reservationsError } = await supabase
      .from("cabin_reservations")
      .select("*")
      .eq("cabin_id", cabin.id)
      .eq("status", "confirmed")
      .order("start_time", { ascending: true });

    if (reservationsError) {
      console.error("Failed to fetch reservations:", reservationsError);
    }

    return {
      ship,
      cabin,
      reservations: reservations || [],
    };
  } catch (error) {
    console.error("Failed to fetch tutorial cabin data:", error);
    return { ship: null, cabin: null, reservations: [] };
  }
}
