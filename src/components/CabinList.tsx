"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { ShipCabin, CabinReservation } from "@/types/database";
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
import Link from "next/link";

interface CabinListProps {
  shipId: string;
  shipPublicId: string;
}

export function CabinList({ shipId, shipPublicId }: CabinListProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [cabins, setCabins] = useState<CabinWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCabins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // 회의실 목록 조회
      const { data: cabinsData, error: cabinsError } = await supabase
        .from("ship_cabins")
        .select("*")
        .eq("ship_id", shipId)
        .order("name", { ascending: true });

      if (cabinsError) {
        throw cabinsError;
      }

      // 오늘 날짜 범위 계산
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // 오늘의 예약 목록만 조회
      const { data: reservationsData, error: reservationsError } =
        await supabase
          .from("cabin_reservations")
          .select("*")
          .eq("status", "confirmed")
          .in(
            "cabin_id",
            (cabinsData || []).map((cabin) => cabin.id)
          )
          .gte("start_time", startOfDay.toISOString())
          .lt("start_time", endOfDay.toISOString());

      if (reservationsError) {
        throw reservationsError;
      }

      // 상태 정보 추가
      const reservationsByCabinId = groupReservationsByCabinId(
        reservationsData || []
      );
      const cabinsWithStatus = addStatusToCabins(
        cabinsData || [],
        reservationsByCabinId
      );

      setCabins(cabinsWithStatus);
    } catch (err: unknown) {
      console.error("Failed to fetch cabins:", err);
      setError(
        err instanceof Error ? err.message : t("ships.errorLoadingCabins")
      );
    } finally {
      setLoading(false);
    }
  }, [shipId]);

  useEffect(() => {
    fetchCabins();

    // Supabase Realtime 구독
    const supabase = createClient();
    const channel = supabase
      .channel("cabin-reservations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cabin_reservations",
        },
        (payload) => {
          // 예약 변경 시 데이터 새로고침
          fetchCabins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipId, fetchCabins]);

  // 현재 시각 경과에 따라 배지 상태를 재계산 (DB 변경 없어도 경계 시각에 반영)
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
    }, 1000);

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

  return (
    <div className="space-y-6">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3 whitespace-pre-wrap">
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
    </div>
  );
}
