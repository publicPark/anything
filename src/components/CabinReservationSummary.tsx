"use client";

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
  const { t } = useI18n();

  const { currentReservation, nextReservation } =
    calculateCabinStatus(reservations);

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

  if (!currentReservation && !nextReservation) {
    return (
      <div
        className={`mb-3 p-3 bg-muted/10 border border-border rounded-md ${
          className ?? ""
        }`.trim()}
      >
        <p className="text-sm text-muted-foreground">
          {t("ships.noTodayReservations")}
        </p>
      </div>
    );
  }

  return (
    <div className={`${className ?? ""}`.trim()}>
      {currentReservation && (
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
                "ko-KR",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}
            </b>{" "}
            {t("cabins.endsAtPlannedSuffix")}
          </div>
        </div>
      )}

      {nextReservation && (
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
                "ko-KR",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}
            </b>{" "}
            {t("cabins.startsAtPlannedSuffix")}
          </div>
        </div>
      )}
    </div>
  );
}
