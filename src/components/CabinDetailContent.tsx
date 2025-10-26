"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { CabinInfo } from "@/components/CabinInfo";
import { ReservationTabs } from "@/components/ReservationTabs";
import { ShipCabin, Ship, CabinReservation } from "@/types/database";
import { useRouter } from "next/navigation";

interface CabinDetailContentProps {
  shipPublicId: string;
  cabinPublicId: string;
  showBreadcrumb?: boolean;
  // 튜토리얼 모드용 props
  tutorialMode?: boolean;
  preloadedData?: {
    ship: Ship | null;
    cabin: ShipCabin | null;
    reservations: CabinReservation[];
    userRole?: "captain" | "mechanic" | "crew" | null;
  };
}

interface CabinDetailState {
  ship: Ship | null;
  cabin: ShipCabin | null;
  reservations: CabinReservation[];
  userRole: "captain" | "mechanic" | "crew" | null;
  isLoading: boolean;
  error: string | null;
}

// 상수 분리
const INITIAL_STATE: CabinDetailState = {
  ship: null,
  cabin: null,
  reservations: [],
  userRole: null,
  isLoading: true,
  error: null,
};

const ERROR_MESSAGES = {
  SHIP_NOT_FOUND: "Ship not found",
  CABIN_NOT_FOUND: "Cabin not found",
  CABIN_NOT_IN_SHIP: "Cabin not found",
} as const;

export function CabinDetailContent({
  shipPublicId,
  cabinPublicId,
  showBreadcrumb = false,
  tutorialMode = false,
  preloadedData,
}: CabinDetailContentProps) {
  const { t, locale } = useI18n();
  const supabase = createClient();
  const { profile } = useProfile();
  const router = useRouter();

  // 상태를 하나의 객체로 관리
  const [state, setState] = useState<CabinDetailState>(() => {
    // 튜토리얼 모드일 때 미리 로드된 데이터로 초기화
    if (tutorialMode && preloadedData) {
      return {
        ship: preloadedData.ship,
        cabin: preloadedData.cabin,
        reservations: preloadedData.reservations,
        userRole: null, // 튜토리얼에서는 사용자 역할 없음
        isLoading: false,
        error: null,
      };
    }
    
    // SSR 모드일 때 미리 로드된 데이터로 초기화
    if (preloadedData) {
      return {
        ship: preloadedData.ship,
        cabin: preloadedData.cabin,
        reservations: preloadedData.reservations,
        userRole: preloadedData.userRole || null,
        isLoading: false,
        error: null,
      };
    }
    return INITIAL_STATE;
  });

  // UI 상태
  const [showReservationForm, setShowReservationForm] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  // 로컬 타임존 기준 YYYY-MM-DD 생성
  const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return getLocalYYYYMMDD(today);
  });

  useEffect(() => {
    const fetchCabinDetails = async () => {
      if (!shipPublicId || !cabinPublicId) return;
      
      // 튜토리얼 모드이거나 미리 로드된 데이터가 있을 때는 fetch하지 않음
      if (tutorialMode || preloadedData) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

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

        if (!shipData) throw new Error(ERROR_MESSAGES.SHIP_NOT_FOUND);
        if (!cabinData) throw new Error(ERROR_MESSAGES.CABIN_NOT_FOUND);
        if (cabinData.ship_id !== shipData.id)
          throw new Error(ERROR_MESSAGES.CABIN_NOT_IN_SHIP);

        // 2단계: 예약 목록과 사용자 역할 조회
        const [reservationsResult, memberResult] = await Promise.all([
          supabase
            .from("cabin_reservations")
            .select("*")
            .eq("cabin_id", cabinData.id)
            .eq("status", "confirmed")
            .order("start_time", { ascending: true }),
          profile?.id
            ? supabase
                .from("ship_members")
                .select("role")
                .eq("ship_id", shipData.id)
                .eq("user_id", profile.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (reservationsResult.error) throw reservationsResult.error;

        setState((prev) => ({
          ...prev,
          ship: shipData,
          cabin: cabinData,
          reservations: reservationsResult.data || [],
          userRole: memberResult.data?.role || null,
          isLoading: false,
        }));
      } catch (err: unknown) {
        console.error("Error fetching cabin details:", err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : t("common.errorOccurred"),
          isLoading: false,
        }));
      }
    };

    fetchCabinDetails();
  }, [shipPublicId, cabinPublicId, profile?.id, tutorialMode, preloadedData]);

  const handleReservationSuccess = useCallback(() => {
    // setShowReservationForm(false);
    setLastUpdateTime(new Date());
    // 예약 성공 시 예약 목록만 새로고침
    if (state.cabin) {
      const fetchReservations = async () => {
        try {
          const { data, error } = await supabase
            .from("cabin_reservations")
            .select("*")
            .eq("cabin_id", state.cabin!.id)
            .eq("status", "confirmed")
            .order("start_time", { ascending: true });

          if (error) throw error;

          setState((prev) => ({ ...prev, reservations: data || [] }));
        } catch (err) {
          console.error("Error fetching reservations:", err);
        }
      };
      fetchReservations();
    }
  }, [state.cabin, supabase]);

  const fetchReservationsOnly = useCallback(async () => {
    if (!state.cabin) return;

    try {
      const { data, error } = await supabase
        .from("cabin_reservations")
        .select("*")
        .eq("cabin_id", state.cabin.id)
        .eq("status", "confirmed")
        .order("start_time", { ascending: true });

      if (error) throw error;

      setState((prev) => ({ ...prev, reservations: data || [] }));
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error("Error fetching reservations:", err);
    }
  }, [state.cabin]);

  // 예약 목록 계산을 useMemo로 최적화
  const { todayReservations, upcomingReservations } = useMemo(() => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      todayReservations: state.reservations.filter((reservation) => {
        const reservationDate = new Date(reservation.start_time);
        return (
          reservationDate.getFullYear() === today.getFullYear() &&
          reservationDate.getMonth() === today.getMonth() &&
          reservationDate.getDate() === today.getDate()
        );
      }),
      upcomingReservations: state.reservations.filter((reservation) => {
        const reservationDate = new Date(reservation.start_time);
        return reservationDate >= today && reservationDate <= weekFromNow;
      }),
    };
  }, [state.reservations]);

  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  if (state.error) {
    return <ErrorMessage message={state.error} />;
  }

  if (!state.cabin) {
    return <ErrorMessage message={t("ships.cabinNotFound")} />;
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumbs - 조건부 표시 */}
      {showBreadcrumb && state.ship && state.cabin && (
        <Breadcrumb
          items={[
            {
              label: (
                <span className="flex items-center gap-2">
                  {state.ship.name}
                  {state.userRole && <RoleBadge role={state.userRole} size="sm" />}
                </span>
              ),
              onClick: () => router.push(`/${locale}/ship/${shipPublicId}`),
            },
            {
              label: t("cabins.viewAllCabins"),
              onClick: () =>
                router.push(`/${locale}/ship/${shipPublicId}/cabins`),
            },
            {
              label: state.cabin.name,
              isCurrentPage: true,
            },
          ]}
        />
      )}

      {/* 메인 컨텐츠 - 좌우 분할 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽 - cabin 정보 + 예약폼 */}
        <div>
          <CabinInfo
            cabin={state.cabin}
            reservations={state.reservations}
            todayReservations={todayReservations}
            showReservationForm={showReservationForm}
            showButton={tutorialMode}
            onToggleReservationForm={() =>
              setShowReservationForm(!showReservationForm)
            }
            onReservationSuccess={handleReservationSuccess}
            lastUpdateTime={lastUpdateTime}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {/* 오른쪽 - 예약 탭 */}
        <div>
          <ReservationTabs
            todayReservations={todayReservations}
            upcomingReservations={upcomingReservations}
            cabinId={state.cabin.id}
            currentUserId={tutorialMode ? undefined : profile?.id}
            userRole={tutorialMode ? undefined : (state.userRole || undefined)}
            existingReservations={state.reservations}
            onUpdate={fetchReservationsOnly}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}
