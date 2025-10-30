"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import {
  getStartEndOfMonthISOInTimeZone,
  getVisibleMonthGridRangeISOInTimeZone,
  getStartEndOfDayISOInTimeZone,
} from "@/lib/datetime";
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
  newlyCreatedReservationId: string | null;
}

// 상수 분리
const INITIAL_STATE: CabinDetailState = {
  ship: null,
  cabin: null,
  reservations: [],
  userRole: null,
  isLoading: true,
  error: null,
  newlyCreatedReservationId: null,
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
        newlyCreatedReservationId: null,
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
        newlyCreatedReservationId: null,
      };
    }
    return INITIAL_STATE;
  });

  // UI 상태
  const [showReservationForm, setShowReservationForm] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
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
  const didSkipInitialSelectedDateEffect = useRef<boolean>(false);

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

        // 2단계: 예약 목록(보이는 달만)과 사용자 역할 조회
        const tz = shipData.time_zone || "Asia/Seoul";
        const refDate = new Date(selectedDate);
        const { startISO, endISO } = getVisibleMonthGridRangeISOInTimeZone(
          tz,
          refDate,
          1
        );
        // Extend range by ±1 day to include cross-boundary reservations
        const oneDayMs = 24 * 60 * 60 * 1000;
        const extendedStartISO = new Date(
          new Date(startISO).getTime() - oneDayMs
        ).toISOString();
        const extendedEndISO = new Date(
          new Date(endISO).getTime() + oneDayMs
        ).toISOString();
        const [reservationsResult, memberResult] = await Promise.all([
          supabase
            .from("cabin_reservations")
            .select("*")
            .eq("cabin_id", cabinData.id)
            .eq("status", "confirmed")
            .gte("end_time", extendedStartISO)
            .lt("start_time", extendedEndISO)
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

  const handleReservationSuccess = useCallback(
    (newReservationId?: string) => {
      setLastUpdateTime(new Date());
      const cabinId = state.cabin?.id;
      if (!cabinId) return;
      // 성공 시 현재 달 범위로 재조회
      (async () => {
        try {
          setIsRefetching(true);
          const tz = state.ship?.time_zone || "Asia/Seoul";
          const refDate = new Date(selectedDate);
          const { startISO, endISO } = getVisibleMonthGridRangeISOInTimeZone(
            tz,
            refDate,
            1
          );
          const oneDayMs = 24 * 60 * 60 * 1000;
          const extendedStartISO = new Date(
            new Date(startISO).getTime() - oneDayMs
          ).toISOString();
          const extendedEndISO = new Date(
            new Date(endISO).getTime() + oneDayMs
          ).toISOString();
          const { data, error } = await supabase
            .from("cabin_reservations")
            .select("*")
            .eq("cabin_id", cabinId)
            .eq("status", "confirmed")
            .gte("end_time", extendedStartISO)
            .lt("start_time", extendedEndISO)
            .order("start_time", { ascending: true });
          if (error) throw error;
          setState((prev) => ({
            ...prev,
            reservations: data || [],
            newlyCreatedReservationId: newReservationId || null,
          }));
        } catch (err) {
          console.error("Error fetching reservations:", err);
        } finally {
          setIsRefetching(false);
        }
      })();
    },
    [state.cabin, state.ship?.time_zone, selectedDate, supabase]
  );

  const fetchReservationsOnly = useCallback(async () => {
    const cabinId = state.cabin?.id;
    if (!cabinId) return;

    try {
      setIsRefetching(true);
      const tz = state.ship?.time_zone || "Asia/Seoul";
      const refDate = new Date(selectedDate);
      const { startISO, endISO } = getVisibleMonthGridRangeISOInTimeZone(
        tz,
        refDate,
        1
      );
      const oneDayMs = 24 * 60 * 60 * 1000;
      const extendedStartISO = new Date(
        new Date(startISO).getTime() - oneDayMs
      ).toISOString();
      const extendedEndISO = new Date(
        new Date(endISO).getTime() + oneDayMs
      ).toISOString();
      const { data, error } = await supabase
        .from("cabin_reservations")
        .select("*")
        .eq("cabin_id", cabinId)
        .eq("status", "confirmed")
        .gte("end_time", extendedStartISO)
        .lt("start_time", extendedEndISO)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setState((prev) => ({ ...prev, reservations: data || [] }));
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error("Error fetching reservations:", err);
    } finally {
      setIsRefetching(false);
    }
  }, [state.cabin, state.ship?.time_zone, selectedDate, supabase]);

  // 달력이 전환되면(선택된 날짜의 달이 바뀌면) 해당 달 범위로 재조회
  useEffect(() => {
    if (!state.cabin || !state.ship || tutorialMode) return;
    if (!didSkipInitialSelectedDateEffect.current) {
      didSkipInitialSelectedDateEffect.current = true;
      return;
    }
    fetchReservationsOnly();
  }, [
    selectedDate,
    state.cabin,
    state.ship,
    tutorialMode,
    fetchReservationsOnly,
  ]);

  // Realtime 구독 - cabin이 로드된 후에 설정
  useEffect(() => {
    if (!state.cabin || tutorialMode) return;

    const channel = supabase
      .channel("cabin-reservations-detail")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cabin_reservations",
          filter: `cabin_id=eq.${state.cabin.id}`,
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          // 예약 변경 시 데이터 새로고침
          fetchReservationsOnly();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.cabin, tutorialMode, fetchReservationsOnly]);

  // 실시간 상태 업데이트를 위한 타이머 (30초마다)
  useEffect(() => {
    if (tutorialMode) return;

    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [tutorialMode]);

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
                  {state.userRole && (
                    <RoleBadge role={state.userRole} size="sm" />
                  )}
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
            onMonthChange={(activeStartDate: Date) => {
              // Refetch using visible grid range for the month of activeStartDate without changing selectedDate
              const tz = state.ship?.time_zone || "Asia/Seoul";
              const { startISO, endISO } =
                getVisibleMonthGridRangeISOInTimeZone(tz, activeStartDate, 1);
              const oneDayMs = 24 * 60 * 60 * 1000;
              const extendedStartISO = new Date(
                new Date(startISO).getTime() - oneDayMs
              ).toISOString();
              const extendedEndISO = new Date(
                new Date(endISO).getTime() + oneDayMs
              ).toISOString();
              (async () => {
                try {
                  setIsRefetching(true);
                  const { data, error } = await supabase
                    .from("cabin_reservations")
                    .select("*")
                    .eq("cabin_id", state.cabin!.id)
                    .eq("status", "confirmed")
                    .gte("end_time", extendedStartISO)
                    .lt("start_time", extendedEndISO)
                    .order("start_time", { ascending: true });
                  if (error) throw error;
                  let merged: CabinReservation[] = data ?? [];
                  // If currently selectedDate lies outside the visible grid month, also fetch that day's reservations
                  const selected = new Date(selectedDate);
                  const selectedISO = selected.toISOString();
                  if (!(selectedISO >= startISO && selectedISO < endISO)) {
                    const { startISO: dayStart, endISO: dayEnd } =
                      getStartEndOfDayISOInTimeZone(tz, selected);
                    const { data: dayData, error: dayError } = await supabase
                      .from("cabin_reservations")
                      .select("*")
                      .eq("cabin_id", state.cabin!.id)
                      .eq("status", "confirmed")
                      .gte("end_time", dayStart)
                      .lt("start_time", dayEnd)
                      .order("start_time", { ascending: true });
                    if (dayError) throw dayError;
                    const byId = new Map<string, (typeof merged)[number]>();
                    merged.forEach((r: CabinReservation) => byId.set(r.id, r));
                    (dayData ?? []).forEach((r: CabinReservation) =>
                      byId.set(r.id, r)
                    );
                    merged = Array.from(byId.values());
                  }
                  setState((prev) => ({ ...prev, reservations: merged }));
                  setLastUpdateTime(new Date());
                } catch (err) {
                  console.error("Error fetching reservations:", err);
                } finally {
                  setIsRefetching(false);
                }
              })();
            }}
            isCalendarLoading={isRefetching}
          />
        </div>

        {/* 오른쪽 - 예약 탭 */}
        <div className="relative">
          <ReservationTabs
            todayReservations={todayReservations}
            upcomingReservations={upcomingReservations}
            cabinId={state.cabin.id}
            currentUserId={tutorialMode ? undefined : profile?.id}
            userRole={tutorialMode ? undefined : state.userRole || undefined}
            existingReservations={state.reservations}
            onUpdate={fetchReservationsOnly}
            selectedDate={selectedDate}
            newlyCreatedReservationId={state.newlyCreatedReservationId}
          />
          {isRefetching && (
            <div className="absolute top-2 right-2 text-sm text-muted-foreground flex items-center gap-2 pointer-events-none">
              <LoadingSpinner size="sm" />
              <span className="sr-only">{t("common.loading")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
