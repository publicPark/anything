"use client";

import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { CabinReservationSummary } from "@/components/CabinReservationSummary";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRouter } from "next/navigation";
import {
  CabinWithStatus,
  addStatusToCabins,
  groupReservationsByCabinId,
  calculateCabinStatus,
} from "@/lib/cabin-status";
import { renderTextWithLinks } from "@/lib/text-helpers";
import { getStartEndOfDayISOInTimeZone } from "@/lib/datetime";
import Link from "next/link";

interface CabinListProps {
  shipId: string;
  shipPublicId: string;
  preloadedCabins?: CabinWithStatus[];
  gridCols?: {
    default?: number;
    md?: number;
    lg?: number;
  };
  maxItems?: number;
  refreshTrigger?: number;
  shipTimeZone?: string;
}

export interface CabinListHandle {
  refresh: () => void;
}

export const CabinList = forwardRef<CabinListHandle, CabinListProps>(
  function CabinList(
    {
      shipId,
      shipPublicId,
      preloadedCabins,
      gridCols,
      maxItems,
      refreshTrigger,
      shipTimeZone,
    },
    ref
  ) {
    const { t, locale } = useI18n();
    const router = useRouter();
    const [cabins, setCabins] = useState<CabinWithStatus[]>(
      preloadedCabins || []
    );
    const [loading, setLoading] = useState(!preloadedCabins);
    const [error, setError] = useState<string | null>(null);

    const fetchCabins = useCallback(
      async (tzSource: "ship" | "browser" = "ship") => {
        try {
          setLoading(true);
          setError(null);

          const supabase = createClient();

          // 오늘 날짜 범위 계산
          // - 초기/SSR 동기화: 선박 타임존 기준
          // - 수동 새로고침: 브라우저 타임존 기준
          const tz =
            tzSource === "browser"
              ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
              : shipTimeZone || "Asia/Seoul";
          const { startISO, endISO } = getStartEndOfDayISOInTimeZone(tz);

          // 1단계: 회의실 목록 조회
          const { data: cabinsData, error: cabinsError } = await supabase
            .from("ship_cabins")
            .select("*")
            .eq("ship_id", shipId)
            .order("name", { ascending: true })
            .limit(maxItems || 1000);

          if (cabinsError) {
            throw cabinsError;
          }

          const cabins = cabinsData || [];

          // 2단계: 해당 회의실들의 예약만 조회 (DB에서 직접 필터링)
          const cabinIds = cabins.map((cabin) => cabin.id);
          const { data: reservationsData, error: reservationsError } =
            await supabase
              .from("cabin_reservations")
              .select("*")
              .eq("status", "confirmed")
              .in("cabin_id", cabinIds)
              // 오늘과 겹치는 모든 예약 포함: (end_time >= startOfDay) AND (start_time < endOfDay)
              .gte("end_time", startISO)
              .lt("start_time", endISO);

          if (reservationsError) {
            throw reservationsError;
          }

          const filteredReservations = reservationsData || [];

          // 상태 정보 추가
          const reservationsByCabinId =
            groupReservationsByCabinId(filteredReservations);
          const cabinsWithStatus = addStatusToCabins(
            cabins,
            reservationsByCabinId
          );

          setCabins(cabinsWithStatus);
        } catch (err: unknown) {
          console.error("Failed to fetch cabins:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load cabins"
          );
        } finally {
          setLoading(false);
        }
      },
      [shipId, shipTimeZone]
    );

    // 특정 시점의 타임존 오프셋 문자열(e.g., GMT+9) 추출
    const getTimeZoneOffsetString = useCallback((timeZone: string) => {
      try {
        const dtf = new Intl.DateTimeFormat("en-US", {
          timeZone,
          timeZoneName: "shortOffset",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const parts = dtf.formatToParts(new Date());
        const tzPart = parts.find((p) => p.type === "timeZoneName");
        return tzPart?.value || ""; // e.g., GMT+9
      } catch {
        return "";
      }
    }, []);

    // Imperative handle for parent to trigger refresh explicitly
    useImperativeHandle(
      ref,
      () => ({
        refresh: () => {
          fetchCabins("browser");
        },
      }),
      [fetchCabins]
    );

    useEffect(() => {
      // SSR로 선로딩된 데이터가 없을 때만 초기 로딩 수행 (선박 타임존 기준)
      if (!preloadedCabins || preloadedCabins.length === 0) {
        fetchCabins("ship");
      }
    }, [shipId, fetchCabins, preloadedCabins]);

    // SSR로 선박 타임존 기준 데이터가 있는 경우,
    // 브라우저 로컬 타임존이 다르면 한 번 브라우저 타임존으로 새로고침
    const didBrowserRefreshRef = useRef(false);
    useEffect(() => {
      if (didBrowserRefreshRef.current) return;
      if (preloadedCabins && preloadedCabins.length > 0 && shipTimeZone) {
        const browserTz =
          Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const shipOffset = getTimeZoneOffsetString(shipTimeZone);
        const browserOffset = getTimeZoneOffsetString(browserTz);
        // 오프셋이 다를 때만 브라우저 타임존 기준으로 1회 새로고침
        if (shipOffset && browserOffset && shipOffset !== browserOffset) {
          didBrowserRefreshRef.current = true;
          fetchCabins("browser");
        }
      }
    }, [preloadedCabins, shipTimeZone, fetchCabins, getTimeZoneOffsetString]);

    // refreshTrigger가 변경될 때마다 새로고침
    useEffect(() => {
      if (refreshTrigger !== undefined && refreshTrigger > 0) {
        fetchCabins("ship");
      }
    }, [refreshTrigger, fetchCabins]);

    // 현재 시각 경과에 따라 배지 상태를 재계산 (DB 변경 없어도 경계 시각에 반영)
    // 30초마다 업데이트로 변경하여 성능 개선
    useEffect(() => {
      const intervalId = setInterval(() => {
        setCabins((prevCabins) =>
          prevCabins.map((cabin) => {
            const { status, currentReservation, nextReservation } =
              calculateCabinStatus(cabin.todayReservations || []);

            if (
              status === cabin.currentStatus &&
              currentReservation === cabin.currentReservation &&
              nextReservation === cabin.nextReservation
            ) {
              return cabin;
            }

            return {
              ...cabin,
              currentStatus: status,
              currentReservation,
              nextReservation,
            };
          })
        );
      }, 30000); // 1초에서 30초로 변경

      return () => clearInterval(intervalId);
    }, []);

    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return <ErrorMessage message={error} />;
    }

    // Grid 클래스 생성
    const getGridClass = () => {
      const defaultCols = gridCols?.default || 1;
      const mdCols = gridCols?.md || 2;
      const lgCols = gridCols?.lg || 3;

      return `grid gap-4 grid-cols-${defaultCols} md:grid-cols-${mdCols} lg:grid-cols-${lgCols}`;
    };

    return (
      <div className="flex flex-col gap-6">
        {/* <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {t("ships.cabins")}
        </h2>
      </div> */}

        {cabins.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t("ships.noCabins")}
            </h3>
          </div>
        ) : (
          <div className={getGridClass()}>
            {cabins.map((cabin) => (
              <div
                key={cabin.id}
                className="bg-muted rounded-lg p-6 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3
                    className="text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                    onClick={() =>
                      router.push(
                        `/${locale}/ship/${shipPublicId}/cabin/${cabin.public_id}`
                      )
                    }
                  >
                    {cabin.name}
                  </h3>
                  <StatusBadge
                    label={
                      cabin.currentStatus === "available"
                        ? t("ships.available")
                        : t("ships.inUse")
                    }
                    tone={
                      cabin.currentStatus === "available"
                        ? "success"
                        : "destructive"
                    }
                    blinking={cabin.currentStatus !== "available"}
                    className="px-2 py-1 text-xs"
                  />
                </div>

                {cabin.description && (
                  <p className="text-muted-foreground text-sm mb-4 whitespace-pre-wrap">
                    {renderTextWithLinks(cabin.description)}
                  </p>
                )}

                {/* 오늘의 예약 요약 (현재/다음 계산 및 빈 상태 포함) */}
                <CabinReservationSummary
                  reservations={cabin.todayReservations || []}
                />

                <div className="w-full">
                  <Link
                    href={`/${locale}/ship/${shipPublicId}/cabin/${cabin.public_id}?reserve=true`}
                  >
                    <Button variant="primary" size="md" className="w-full">
                      {t("ships.reserveCabin")}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 타임존 표시는 상단 액션(ShipCabinsContent) 토스트로 대체 */}
      </div>
    );
  }
);
