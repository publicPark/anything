"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ReservationForm } from "@/components/ReservationForm";
import { CabinReservation } from "@/types/database";

interface ReservationItemProps {
  reservation: CabinReservation;
  currentUserId?: string;
  userRole?: "captain" | "mechanic" | "crew";
  onUpdate: () => void;
  isCurrent?: boolean;
  hideTypeBadge?: boolean;
  leftExtra?: ReactNode;
  cabinId?: string;
  existingReservations?: CabinReservation[];
}

export function ReservationItem({
  reservation,
  currentUserId,
  userRole,
  onUpdate,
  isCurrent = false,
  hideTypeBadge = false,
  leftExtra,
  cabinId,
  existingReservations = [],
}: ReservationItemProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isOwner = reservation.user_id === currentUserId;
  const isGuest = reservation.user_id === null;
  const canManage = userRole === "captain" || userRole === "mechanic";
  const canDelete = isOwner || isGuest || canManage;
  const canEdit = isOwner || canManage;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    onUpdate();
  };

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
    } catch (err: unknown) {
      console.error("Failed to delete reservation:", err);
      setError(err instanceof Error ? err.message : t("ships.errorGeneric"));
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

    // 현재 진행 중인 예약의 남은 시간 계산
    const getRemainingTime = () => {
      if (!isCurrent) return null;

      const end = new Date(reservation.end_time);
      const diff = end.getTime() - currentTime.getTime();

      if (diff <= 0) return null;

      const remainingHours = Math.floor(diff / (1000 * 60 * 60));
      const remainingMinutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
      );

      if (remainingHours > 0) {
        return `${remainingHours}시간 ${remainingMinutes}분`;
      } else {
        return `${remainingMinutes}분`;
      }
    };

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
              <div>
                <span className="font-semibold">{dateLabel} </span>
                <span className="font-bold">{timeLabel}</span>
                <span className="text-foreground"> ({durationLabel})</span>
              </div>
            );
          })()}
          <div>{reservation.purpose}</div>
        </div>
        <div className="ml-4 shrink-0">{renderStatusBadge()}</div>
      </div>

      {/* Bottom: left (slot/badge) / right (actions) */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-h-[24px]">
          {leftExtra ? (
            leftExtra
          ) : !hideTypeBadge && getReservationType() ? (
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isOwner
                  ? "bg-muted-foreground/30 text-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {getReservationType()}
            </span>
          ) : null}
        </div>

        {(canEdit || canDelete) && (
          <div className="flex space-x-2">
            {canEdit && cabinId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEdit}
                disabled={isLoading}
              >
                {t("ships.editReservation")}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : t("ships.deleteReservation")}
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && cabinId && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-muted rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t("ships.editReservation")}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            <ReservationForm
              cabinId={cabinId}
              onSuccess={handleEditSuccess}
              existingReservations={existingReservations.filter(
                (r) => r.id !== reservation.id
              )}
              isModal={true}
              editingReservation={reservation}
            />
          </div>
        </div>
      )}
    </div>
  );
}
