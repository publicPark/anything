"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CabinReservation } from "@/types/database";

interface ReservationItemProps {
  reservation: CabinReservation;
  currentUserId?: string;
  userRole?: "captain" | "mechanic" | "crew";
  onUpdate: () => void;
  isCurrent?: boolean;
}

export function ReservationItem({
  reservation,
  currentUserId,
  userRole,
  onUpdate,
  isCurrent = false,
}: ReservationItemProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = reservation.user_id === currentUserId;
  const isGuest = reservation.user_id === null;
  const canManage = userRole === "captain" || userRole === "mechanic";
  const canDelete = isOwner || isGuest || canManage;

  const handleDelete = async () => {
    if (!confirm(t("ships.confirmDeleteReservation"))) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.rpc("delete_cabin_reservation", {
        reservation_uuid: reservation.id,
      });

      if (error) {
        throw error;
      }

      onUpdate();
    } catch (err: any) {
      console.error("Failed to delete reservation:", err);
      setError(err.message || t("ships.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  const formatReservationTime = (
    startTime: string,
    endTime: string
  ): { dateLabel: string; timeLabel: string; durationLabel: string } => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDateOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );

    let dateLabel = "";
    if (startDateOnly.getTime() === today.getTime()) {
      dateLabel = t("common.today");
    } else if (startDateOnly.getTime() === tomorrow.getTime()) {
      dateLabel = t("common.tomorrow");
    } else {
      const month = startDate.getMonth() + 1;
      const day = startDate.getDate();
      dateLabel = `${month}월 ${day}일`;
    }

    const startTimeStr = startDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const endTimeStr = endDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // 시간 길이 계산 (분 단위)
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // 시간 길이를 시간과 분으로 변환
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    let durationStr = "";
    if (hours > 0 && minutes > 0) {
      durationStr = `${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      durationStr = `${hours}시간`;
    } else {
      durationStr = `${minutes}분`;
    }

    return {
      dateLabel,
      timeLabel: `${startTimeStr} - ${endTimeStr}`,
      durationLabel: durationStr,
    };
  };

  const getReservationType = () => {
    if (isGuest) {
      return t("ships.guestReservation");
    }
    if (isOwner) {
      return t("ships.myReservation");
    }
    return "";
  };

  const getReservationStatus = (): "ongoing" | "upcoming" | "ended" => {
    const now = new Date();
    const start = new Date(reservation.start_time);
    const end = new Date(reservation.end_time);
    if (now >= start && now < end) return "ongoing";
    if (start > now) return "upcoming";
    return "ended";
  };

  const renderStatusBadge = () => {
    const status = getReservationStatus();
    const base =
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    if (status === "ongoing") {
      return (
        <span
          className={`${base} bg-destructive/10 text-destructive border border-destructive`}
        >
          {t("ships.statusOngoing")}
        </span>
      );
    }
    if (status === "upcoming") {
      return (
        <span
          className={`${base} bg-info/10 text-info-600 border border-info/600`}
        >
          {t("ships.statusUpcoming")}
        </span>
      );
    }
    return (
      <span
        className={`${base} bg-muted-foreground/10 text-muted-foreground border border-border`}
      >
        {t("ships.statusEnded")}
      </span>
    );
  };

  return (
    <div
      className={`rounded-lg p-6 border ${
        isCurrent ? "bg-muted border-destructive/60" : "bg-muted border-border"
      }`}
    >
      {/* Top: left (data) / right (status badge) */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 text-sm text-foreground">
          {(() => {
            const { dateLabel, timeLabel, durationLabel } =
              formatReservationTime(
                reservation.start_time,
                reservation.end_time
              );
            return (
              <div className="font-semibold">
                <span>{dateLabel} </span>
                <span className="font-bold">{timeLabel}</span>
                <span> ({durationLabel})</span>
              </div>
            );
          })()}
          <div>{reservation.purpose}</div>
        </div>
        <div className="ml-4 shrink-0">{renderStatusBadge()}</div>
      </div>

      {/* Bottom: badge on the left, button on the right */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getReservationType() && (
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isOwner
                  ? "bg-muted-foreground/30 text-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {getReservationType()}
            </span>
          )}
        </div>

        {canDelete && (
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : t("ships.deleteReservation")}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}
    </div>
  );
}
