"use client";

import { useState, useEffect, type ReactNode, memo } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ReservationForm } from "@/components/ReservationForm";
import { CabinReservation } from "@/types/database";
import { deleteReservationSlackMessageAction } from "@/app/actions/slack";
import { formatReservationDuration } from "@/lib/datetime";

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
  isNewlyCreated?: boolean;
}

const ReservationItemComponent = ({
  reservation,
  currentUserId,
  userRole,
  onUpdate,
  isCurrent = false,
  hideTypeBadge = false,
  leftExtra,
  cabinId,
  existingReservations = [],
  isNewlyCreated = false,
}: ReservationItemProps) => {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

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
  const canEdit = isOwner || isGuest || canManage;

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

      // 먼저 Slack 메시지 ts를 조회 (삭제 전에)
      const { data: reservationData } = await supabase
        .from("cabin_reservations")
        .select("slack_message_ts")
        .eq("id", reservation.id)
        .single();

      // 예약 삭제
      const { error } = await supabase.rpc("delete_cabin_reservation", {
        reservation_uuid: reservation.id,
      });

      if (error) {
        throw error;
      }

      // UI 업데이트 먼저 처리
      onUpdate();
      toast.success(t("ships.reservationDeleted"));

      // Slack 메시지가 있으면 삭제 (백그라운드 처리)
      if (reservationData?.slack_message_ts && cabinId) {
        console.log("🗑️ Marking Slack message as deleted:", {
          messageTs: reservationData.slack_message_ts,
          cabinId: cabinId,
        });
        // 백그라운드에서 슬랙 메시지 삭제
        deleteReservationSlackMessageAction(
          cabinId,
          reservationData.slack_message_ts
        )
          .then((result) => {
            if (result.success) {
              console.log("✅ Slack message deleted");
              try {
                toast.default(t("ships.slackMessageDeleted"));
              } catch {}
            } else {
              console.log("ℹ️ Slack message update skipped:", result.reason);
            }
          })
          .catch((notificationError) => {
            console.error(
              "❌ Failed to delete Slack message:",
              notificationError
            );
            // Slack 메시지 수정 실패해도 예약 삭제는 성공으로 처리
          });
      } else {
        console.log("ℹ️ No Slack message to update");
      }
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
      dateLabel = startDate.toLocaleDateString(
        locale === "ko" ? "ko-KR" : "en-US",
        locale === "ko"
          ? { month: "numeric", day: "numeric" }
          : { month: "short", day: "numeric" }
      );
    }

    const startTimeStr = startDate.toLocaleTimeString(
      locale === "ko" ? "ko-KR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: locale !== "ko",
      }
    );
    const endTimeStr = endDate.toLocaleTimeString(
      locale === "ko" ? "ko-KR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: locale !== "ko",
      }
    );

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

      const parts: string[] = [];
      if (remainingHours > 0)
        parts.push(t("timetable.hour", { count: remainingHours }));
      if (remainingMinutes > 0)
        parts.push(t("timetable.minute", { count: remainingMinutes }));
      return parts.join(" ");
    };

    // 소요 시간 문자열 생성 (공통 유틸리티 함수 사용)
    const durationStr = formatReservationDuration(startTime, endTime, t) || "";

    return {
      dateLabel,
      timeLabel: `${startTimeStr} - ${endTimeStr}`,
      durationLabel: durationStr,
    };
  };

  const [badges, setBadges] = useState<
    Array<{
      text: string;
      variant: "primary" | "secondary";
      clickable?: boolean;
      onClick?: () => void;
    }>
  >([]);

  useEffect(() => {
    const getReservationBadges = () => {
      const newBadges: Array<{
        text: string;
        variant: "primary" | "secondary";
        clickable?: boolean;
        onClick?: () => void;
      }> = [];

      if (isGuest) {
        // 비회원 예약 - 클릭 가능한 뱃지
        newBadges.push({
          text: t("cabins.guestReservation"),
          variant: "secondary" as const,
          clickable: true,
          onClick: () => {
            if (reservation.guest_identifier) {
              toast.default(`${reservation.guest_identifier}`);
            } else {
              toast.default("not set");
            }
          },
        });

        // 내 비회원 예약인지 확인 (localStorage의 guest_identifier와 비교)
        if (reservation.guest_identifier) {
          try {
            const myGuestId = localStorage.getItem("guest_identifier");
            if (myGuestId === reservation.guest_identifier) {
              newBadges.push({
                text: t("cabins.myReservation"),
                variant: "primary" as const,
              });
            }
          } catch (error) {
            // localStorage 접근 실패 시 무시
            console.warn("Failed to access localStorage:", error);
          }
        }
      } else if (reservation.user_id) {
        // 회원 예약 (내 예약이든 다른 사람 예약이든)
        const userName = reservation.user_display_name || "😉";
        newBadges.push({
          text: userName,
          variant: "secondary" as const,
          // clickable: true,
          onClick: () => {
            toast.default(`${reservation.user_id}`);
          },
        });

        // 내 예약인 경우에만 "내 예약" 뱃지 추가
        if (isOwner) {
          newBadges.push({
            text: t("cabins.myReservation"),
            variant: "primary" as const,
          });
        }
      }

      return newBadges;
    };

    setBadges(getReservationBadges());
  }, [
    isGuest,
    reservation.guest_identifier,
    reservation.user_id,
    reservation.user_display_name,
    isOwner,
  ]);

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

  const status = getReservationStatus();
  const shouldShowNewlyCreatedBorder = isNewlyCreated && !hasBeenClicked;

  const handleCardClick = () => {
    if (isNewlyCreated && !hasBeenClicked) {
      setHasBeenClicked(true);
    }
  };

  return (
    <div
      className={`rounded-lg p-6 border ${
        isCurrent
          ? "bg-muted border-destructive/60"
          : shouldShowNewlyCreatedBorder
          ? "bg-muted border-primary shadow-lg shadow-primary/20"
          : status === "ended"
          ? "bg-muted/50 border-border"
          : "bg-muted border-border"
      }`}
      onClick={handleCardClick}
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
                {durationLabel ? (
                  <span className="text-foreground"> ({durationLabel})</span>
                ) : null}
              </div>
            );
          })()}
          <div>{reservation.purpose}</div>
        </div>
        <div className="ml-4 shrink-0">{renderStatusBadge()}</div>
      </div>

      {/* Bottom: left (slot/badge) / right (actions) */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-h-[24px] shrink-0">
          {leftExtra ? (
            leftExtra
          ) : !hideTypeBadge ? (
            <div className="flex items-center gap-2">
              {badges.map((badge, index) =>
                badge.clickable ? (
                  <button
                    key={index}
                    onClick={badge.onClick}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                      badge.variant === "primary"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {badge.text}
                  </button>
                ) : (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      badge.variant === "primary"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {badge.text}
                  </span>
                )
              )}
            </div>
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
          <ErrorMessage message={error} variant="destructive" />
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
};

export const ReservationItem = memo(ReservationItemComponent);
