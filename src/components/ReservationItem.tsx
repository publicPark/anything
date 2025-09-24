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

  const formatReservationTime = (startTime: string, endTime: string) => {
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

    return `${dateLabel} ${startTimeStr} - ${endTimeStr} (${durationStr})`;
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

  return (
    <div
      className={`rounded-lg p-6 border ${
        isCurrent
          ? "bg-destructive/10 border-destructive/20 shadow-md"
          : "bg-muted border-border"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {getReservationType() && (
            <div className="mb-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isOwner
                    ? "role-captain"
                    : "bg-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {getReservationType()}
              </span>
            </div>
          )}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {reservation.purpose}
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">
                {formatReservationTime(
                  reservation.start_time,
                  reservation.end_time
                )}
              </span>
            </div>
          </div>
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
