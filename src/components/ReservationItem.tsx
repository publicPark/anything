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
}

export function ReservationItem({
  reservation,
  currentUserId,
  userRole,
  onUpdate,
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
      dateLabel = "오늘";
    } else if (startDateOnly.getTime() === tomorrow.getTime()) {
      dateLabel = "내일";
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

    return `${dateLabel} ${startTimeStr} - ${endTimeStr}`;
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
    <div className="bg-muted rounded-lg p-6 border border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
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
            {getReservationType() && (
              <div>
                <span className="font-medium">{getReservationType()}</span>
              </div>
            )}
          </div>
        </div>

        {canDelete && (
          <div className="flex space-x-2">
            <Button
              variant="destructive"
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
