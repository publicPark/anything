"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import type { ReactNode } from "react";
import { CabinReservation } from "@/types/database";
import { calculateCabinStatus } from "@/lib/cabin-status";

interface CabinReservationSummaryProps {
  reservations: CabinReservation[];
  className?: string;
}

export function CabinReservationSummary({
  reservations,
  className,
}: CabinReservationSummaryProps) {
  const { t, locale } = useI18n();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { currentReservation, nextReservation } =
    calculateCabinStatus(reservations);

  // 남은 시간 계산
  const getRemainingTime = (endTime: string) => {
    const end = new Date(endTime);
    const now = currentTime;
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts: string[] = [];
    if (hours > 0) parts.push(t("timetable.hour", { count: hours }));
    if (minutes >= 0) parts.push(t("timetable.minute", { count: minutes }));
    return parts.join(" ");
  };

  const renderStatusBadge = (type: "ongoing" | "upcoming"): ReactNode => {
    const base =
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border";
    if (type === "ongoing") {
      return (
        <span
          className={`${base} bg-destructive/10 text-destructive border-destructive`}
        >
          {t("ships.statusOngoing")}
        </span>
      );
    }
    return (
      <span className={`${base} bg-info/10 text-info-600 border-info/600`}>
        {t("ships.statusUpcoming")}
      </span>
    );
  };

  return (
    <div className={`${className ?? ""}`.trim()}>
      {/* 현재 예약 상태 */}
      {currentReservation ? (
        <div className="mb-3 p-3 bg-muted border border-destructive/60 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-foreground font-medium mr-3 truncate">
              {currentReservation.purpose || t("cabins.reservationTitle")}
            </p>
            {renderStatusBadge("ongoing")}
          </div>
          <div className="text-sm text-foreground">
            <b>
              {new Date(currentReservation.end_time).toLocaleTimeString(
                locale === "ko" ? "ko-KR" : "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}
            </b>{" "}
            {t("cabins.endsAtPlannedSuffix")}
            {(() => {
              const remainingTime = getRemainingTime(
                currentReservation.end_time
              );
              if (remainingTime) {
                return (
                  <>
                    {", "}
                    <span className="text-foreground font-semibold">
                      {t("timetable.about")} {remainingTime}{" "}
                      {t("ships.remaining")}
                    </span>
                  </>
                );
              }
              return null;
            })()}
          </div>
        </div>
      ) : (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 font-medium">
            {t("ships.currentlyAvailable")}
          </p>
        </div>
      )}

      {/* 예정된 예약 */}
      {nextReservation ? (
        <div className="mb-3 p-3 bg-muted/10 border border-border rounded-md">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-foreground font-medium mr-3 truncate">
              {nextReservation.purpose || t("cabins.reservationTitle")}
            </p>
            {renderStatusBadge("upcoming")}
          </div>
          <div className="text-sm text-foreground">
            <b>
              {new Date(nextReservation.start_time).toLocaleTimeString(
                locale === "ko" ? "ko-KR" : "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}
            </b>{" "}
            {t("cabins.startsAtPlannedSuffix")}
          </div>
        </div>
      ) : (
        <div className="mb-3 p-3 bg-muted/10 border border-border rounded-md">
          <p className="text-sm text-muted-foreground">
            {t("ships.noTodayReservations")}
          </p>
        </div>
      )}
    </div>
  );
}
