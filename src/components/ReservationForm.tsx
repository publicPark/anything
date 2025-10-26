"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { useParticleAnimation } from "@/hooks/useParticleAnimation";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import {
  createReservationOnlyAction,
  sendReservationNotificationAction,
  updateReservationSlackMessage,
} from "@/app/actions/reservations";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Calendar } from "@/components/ui/Calendar";
import { CabinReservation } from "@/types/database";
import dynamic from "next/dynamic";

const TimeTable = dynamic(() => import("@/components/TimeTable").then(mod => ({ default: mod.TimeTable })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-sm text-muted-foreground">Loading timetable...</div>
    </div>
  ),
});
import { useReservationStore } from "@/stores/reservationStore";

interface ReservationFormProps {
  cabinId: string;
  onSuccess: () => void;
  existingReservations?: CabinReservation[];
  isModal?: boolean;
  editingReservation?: CabinReservation;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export function ReservationForm({
  cabinId,
  onSuccess,
  existingReservations = [],
  isModal = false,
  editingReservation,
  selectedDate: externalSelectedDate,
  onDateChange: externalOnDateChange,
}: ReservationFormProps) {
  const { t, locale } = useI18n();
  const { profile } = useProfile();
  const toast = useToast();
  const { trigger: triggerParticles, element: particleElement } =
    useParticleAnimation({ particleCount: 150 });
  const {
    selectedStartTime,
    selectedEndTime,
    clearSelection,
    setSelectedTimes,
  } = useReservationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로컬 타임존 기준 YYYY-MM-DD 생성
  const getLocalYYYYMMDD = (d: Date) => {
    // 로컬 시간대를 명시적으로 사용
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 오늘 날짜를 기본값으로 설정 (로컬 기준)
  const today = getLocalYYYYMMDD(new Date());

  // 기존 예약 데이터로 폼 초기화
  const getInitialFormData = () => {
    if (editingReservation) {
      const startDate = new Date(editingReservation.start_time);
      return {
        date: getLocalYYYYMMDD(startDate),
        purpose: editingReservation.purpose,
      };
    }
    return {
      date: today,
      purpose: profile?.display_name ? `${profile.display_name}` : "",
    };
  };

  // 폼 데이터 - 외부에서 selectedDate가 제공되면 그걸 사용
  const [formData, setFormData] = useState(() => {
    const initial = getInitialFormData();
    return {
      ...initial,
      date: externalSelectedDate || initial.date,
    };
  });

  // 기존 예약 데이터가 있을 때 시간 선택 초기화
  useEffect(() => {
    if (editingReservation) {
      const startDate = new Date(editingReservation.start_time);
      const endDate = new Date(editingReservation.end_time);

      // 24시간 형식으로 직접 변환 (toLocaleTimeString 대신)
      const startTimeStr = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
      const endTimeStr = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

      setSelectedTimes(startTimeStr, endTimeStr);
    }
  }, [editingReservation, setSelectedTimes]);

  // 외부에서 selectedDate가 변경되면 내부 상태도 업데이트
  useEffect(() => {
    if (externalSelectedDate && externalSelectedDate !== formData.date) {
      setFormData((prev) => ({ ...prev, date: externalSelectedDate }));
      clearSelection(); // 날짜가 바뀌면 시간 선택 초기화
    }
  }, [externalSelectedDate, formData.date, clearSelection]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // 날짜가 변경되면 선택된 시간 초기화
    if (name === "date" && formData.date !== value) {
      clearSelection();
      externalOnDateChange?.(value); // 외부 콜백 호출
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: string) => {
    if (formData.date !== date) {
      clearSelection();
      externalOnDateChange?.(date); // 외부 콜백 호출
      setFormData((prev) => ({
        ...prev,
        date,
      }));
    }
  };

  const handleCreateReservation = async () => {
    if (isLoading) return;

    // 필수 필드 검증
    if (
      !formData.date ||
      !selectedStartTime ||
      !selectedEndTime ||
      !formData.purpose.trim()
    ) {
      setError(t("validation.allFieldsRequired"));
      return;
    }

    // 시간 검증 및 날짜 계산
    const createDateTime = (dateStr: string, timeStr: string, isEndTime = false): Date => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date(dateStr);

      // 24:00 시간 처리 (다음 날 00:00으로 변환)
      if (hours === 24 && minutes === 0) {
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
      }
      // 24시간을 넘어가면 다음 날로 처리
      else if (hours >= 24) {
        date.setDate(date.getDate() + 1);
        date.setHours(hours - 24, minutes, 0, 0);
      } else {
        date.setHours(hours, minutes, 0, 0);
      }

      return date;
    };

    const startDateTime = createDateTime(formData.date, selectedStartTime);
    const endDateTime = createDateTime(formData.date, selectedEndTime);
    
    // 자정을 넘나드는 경우 처리 (시간 문자열 비교로 자정 넘나드는지 확인)
    const isMidnightCrossing = selectedStartTime > selectedEndTime;
    if (isMidnightCrossing) {
      // 종료 시간을 다음 날로 설정
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    // 과거 시간 방지: 오늘 날짜인 경우 현재 시각을 선택된 간격 단위로 내림한 시각보다 빠르면 막기
    // 단, 예약 수정 시에는 과거 시간 선택 허용
    const now = new Date();
    const todayLocal = getLocalYYYYMMDD(now);
    if (formData.date === todayLocal && !editingReservation) {
      const flooredNow = new Date(now);
      flooredNow.setSeconds(0, 0);

      // 선택된 간격 단위에 따라 내림 처리
      const currentMinute = flooredNow.getMinutes();

      // 선택된 시간 범위에서 간격 단위 추정
      const timeDiff = endDateTime.getTime() - startDateTime.getTime();
      const intervalMinutes = Math.round(timeDiff / (1000 * 60)); // 분 단위로 변환

      if (intervalMinutes >= 60) {
        // 1시간 이상인 경우 시간 단위로 내림
        flooredNow.setMinutes(0, 0);
      } else {
        // 분 단위로 내림
        flooredNow.setMinutes(
          Math.floor(currentMinute / intervalMinutes) * intervalMinutes
        );
      }

      if (startDateTime < flooredNow) {
        setError(t("timetable.pastTimeNotification"));
        return;
      }
    }

    // 자정을 넘나드는 경우가 아닌데 종료 시간이 시작 시간보다 이른 경우만 에러
    if (!isMidnightCrossing && endDateTime <= startDateTime) {
      setError(t("validation.endTimeAfterStart"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (editingReservation) {
        // 예약 수정
        const { error } = await supabase.rpc("update_cabin_reservation", {
          reservation_uuid: editingReservation.id,
          new_start_time: startDateTime.toISOString(),
          new_end_time: endDateTime.toISOString(),
          new_purpose: formData.purpose.trim(),
        });

        if (error) throw error;

        // UI 업데이트 먼저 처리
        clearSelection();
        // 예약 목적 초기화 (빈칸으로)
        setFormData((prev) => ({
          ...prev,
          purpose: "",
        }));

        // 성공 메시지 표시
        toast.success(t("ships.reservationUpdated"));
        onSuccess();

        // 예약 수정 시 Slack 메시지 업데이트 (백그라운드 처리)
        updateReservationSlackMessage(
          editingReservation.id,
          startDateTime.toISOString(),
          endDateTime.toISOString(),
          formData.purpose.trim(),
          cabinId,
          locale
        )
          .then((slackResult) => {
            // 슬랙 메시지 업데이트 성공 시 토스트 표시
            if (slackResult.success) {
              toast.default(t("ships.slackMessageUpdated"));
            }
          })
          .catch((slackError) => {
            console.error("Slack message update failed:", slackError);
            // Slack 업데이트 실패해도 예약 수정은 성공으로 처리
          });
      } else {
        // 사용자 정보 수집
        let guestIdentifier: string | undefined;
        let userDisplayName: string | undefined;

        if (profile) {
          // 회원: 사용자 이름 저장
          userDisplayName =
            profile.display_name || profile.username || "Unknown";
        } else {
          // 비회원: IP + User-Agent 해시 생성
          try {
            const response = await fetch("/api/get-client-info", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Response is not JSON");
            }

            const clientInfo = await response.json();
            const combined = `${clientInfo.ip}-${clientInfo.userAgent}`;
            guestIdentifier = btoa(combined).substring(0, 16); // Base64 인코딩 후 16자리만

            // localStorage에 저장하여 나중에 "내 예약" 판별에 사용
            localStorage.setItem("guest_identifier", guestIdentifier);
          } catch (error) {
            console.error("Failed to get client info:", error);
            // 실패 시 랜덤 식별자 생성
            guestIdentifier = `guest_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 8)}`;
            localStorage.setItem("guest_identifier", guestIdentifier);
          }
        }

        // 1. 예약 생성만 먼저 처리 (빠른 응답)
        try {
          const result = await createReservationOnlyAction({
            cabinId,
            startISO: startDateTime.toISOString(),
            endISO: endDateTime.toISOString(),
            purpose: formData.purpose.trim(),
            locale: locale,
            guestIdentifier,
            userDisplayName,
          });

          if (result.ok) {
            // UI 업데이트 처리 (즉시)
            clearSelection();
            setFormData((prev) => ({
              ...prev,
              purpose: "",
            }));

            // 성공 메시지 표시
            triggerParticles();
            toast.success(t("ships.reservationCreated"));
            onSuccess();

            // 2. 슬랙 알림은 백그라운드에서 처리
            sendReservationNotificationAction({
              cabinId,
              startISO: startDateTime.toISOString(),
              endISO: endDateTime.toISOString(),
              purpose: formData.purpose.trim(),
              locale: locale,
            })
              .then((notificationResult) => {
                if (notificationResult.ok) {
                  // 슬랙 메시지 전송 결과에 따른 토스트 표시
                  if (notificationResult.slackSent) {
                    if (notificationResult.slackMethod === "bot") {
                      toast.default(t("ships.slackBotMessageSent"));
                    } else if (notificationResult.slackMethod === "webhook") {
                      toast.default(t("ships.slackWebhookMessageSent"));
                    } else {
                      toast.default(t("ships.slackMessageSent"));
                    }
                  }

                  if (notificationResult.discordSent) {
                    toast.default(t("ships.discordMessageSent"));
                  }
                }
              })
              .catch((error) => {
                console.error("Notification failed:", error);
                // 알림 실패해도 예약은 성공으로 처리
              });
          } else {
            // 예약 생성 실패 시 에러 표시
            setError(result.message || t("ships.errorGeneric"));
          }
        } catch (error) {
          console.error("Reservation creation failed:", error);
          setError(
            error instanceof Error ? error.message : t("ships.errorGeneric")
          );
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("ships.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={isModal ? "p-6" : ""}>
        <div className="space-y-2">
          {/* 날짜 선택 */}
          <div>
            <Calendar
              selectedDate={formData.date}
              onDateChange={handleDateChange}
              reservations={existingReservations}
            />
          </div>

          {/* 시간 선택 */}
          <div>
            <TimeTable
              selectedDate={formData.date}
              reservations={existingReservations}
            />
          </div>

          {/* 예약 목적 */}
          <div>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              placeholder={t("ships.reservationPurposePlaceholder")}
              rows={1}
              className="w-full px-4 py-3 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
            {/* <p className="mb-2 text-xs text-muted-foreground">
              {t("ships.reservationPurposeExample")}
            </p> */}
          </div>

          {error && (
            <div className="mb-4">
              <ErrorMessage
                message={error}
                variant="destructive"
                onClose={() => setError(null)}
              />
            </div>
          )}

          {/* 버튼 */}
          <div>
            <Button
              type="button"
              size="lg"
              variant="primary"
              disabled={isLoading}
              onClick={handleCreateReservation}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner />
                  <span>{t("common.processing")}</span>
                </div>
              ) : editingReservation ? (
                t("ships.updateReservation")
              ) : (
                t("ships.createReservation")
              )}
            </Button>
          </div>
        </div>
      </div>
      {particleElement}
    </>
  );
}
