"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { ShipCabin, CabinReservation } from "@/types/database";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import {
  CabinWithStatus,
  addStatusToCabins,
  groupReservationsByCabinId,
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
  }, [shipId]);

  const fetchCabins = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // 회의실 목록 조회
      const { data: cabinsData, error: cabinsError } = await supabase
        .from("ship_cabins")
        .select("*")
        .eq("ship_id", shipId)
        .order("created_at", { ascending: false });

      if (cabinsError) {
        throw cabinsError;
      }

      // 예약 목록 조회
      const { data: reservationsData, error: reservationsError } =
        await supabase
          .from("cabin_reservations")
          .select("*")
          .eq("status", "confirmed")
          .in(
            "cabin_id",
            (cabinsData || []).map((cabin) => cabin.id)
          );

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
    } catch (err: any) {
      console.error("Failed to fetch cabins:", err);
      setError(err.message || t("ships.errorLoadingCabins"));
    } finally {
      setLoading(false);
    }
  };

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
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    cabin.currentStatus === "available"
                      ? "bg-success-600 text-success-foreground"
                      : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {cabin.currentStatus === "available"
                    ? t("ships.available")
                    : t("ships.inUse")}
                </span>
              </div>

              {cabin.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3 whitespace-pre-wrap">
                  {renderTextWithLinks(cabin.description)}
                </p>
              )}

              {/* 현재 예약 정보 */}
              {cabin.currentReservation && (
                <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-destructive">
                      {t("cabins.currentReservation")}
                    </span>
                    <span className="text-xs text-destructive">
                      {t("cabins.endsAt", {
                        time: new Date(
                          cabin.currentReservation.end_time
                        ).toLocaleTimeString("ko-KR", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }),
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    {cabin.currentReservation.purpose ||
                      t("cabins.reservationTitle")}
                  </p>
                </div>
              )}

              {/* 다음 예약 정보 */}
              {cabin.nextReservation && (
                <div className="mb-3 p-3 bg-muted/50 border border-border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("cabins.nextReservation")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("cabins.startsAt", {
                        time: new Date(
                          cabin.nextReservation.start_time
                        ).toLocaleTimeString("ko-KR", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }),
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    {cabin.nextReservation.purpose ||
                      t("cabins.reservationTitle")}
                  </p>
                </div>
              )}

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
