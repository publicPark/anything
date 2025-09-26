"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TimeTable } from "@/components/TimeTable";
import { CabinReservation } from "@/types/database";
import { useReservationStore } from "@/stores/reservationStore";

interface ReservationFormProps {
  cabinId: string;
  onSuccess: () => void;
  existingReservations?: CabinReservation[];
  isModal?: boolean;
  editingReservation?: CabinReservation;
}

export function ReservationForm({
  cabinId,
  onSuccess,
  existingReservations = [],
  isModal = false,
  editingReservation,
}: ReservationFormProps) {
  const { t, locale } = useI18n();
  const { profile } = useProfile();
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
      purpose: profile?.display_name ? `${profile.display_name}의 예약` : "",
    };
  };

  // 폼 데이터
  const [formData, setFormData] = useState(getInitialFormData());

  // 기존 예약 데이터가 있을 때 시간 선택 초기화
  useEffect(() => {
    if (editingReservation) {
      const startDate = new Date(editingReservation.start_time);
      const endDate = new Date(editingReservation.end_time);

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

      setSelectedTimes(startTimeStr, endTimeStr);
    }
  }, [editingReservation, setSelectedTimes]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // 날짜가 변경되면 선택된 시간 초기화
    if (name === "date" && formData.date !== value) {
      clearSelection();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    const createDateTime = (dateStr: string, timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date(dateStr);

      // 24시간을 넘어가면 다음 날로 처리
      if (hours >= 24) {
        date.setDate(date.getDate() + 1);
        date.setHours(hours - 24, minutes, 0, 0);
      } else {
        date.setHours(hours, minutes, 0, 0);
      }

      return date;
    };

    const startDateTime = createDateTime(formData.date, selectedStartTime);
    const endDateTime = createDateTime(formData.date, selectedEndTime);

    // 과거 시간 방지: 오늘 날짜인 경우 현재 시각을 5분 단위로 내림한 시각보다 빠르면 막기
    const now = new Date();
    const todayLocal = getLocalYYYYMMDD(now);
    if (formData.date === todayLocal) {
      const flooredNow = new Date(now);
      flooredNow.setSeconds(0, 0);
      flooredNow.setMinutes(Math.floor(flooredNow.getMinutes() / 5) * 5);
      if (startDateTime < flooredNow) {
        setError(t("timetable.pastTimeNotification"));
        return;
      }
    }

    if (endDateTime <= startDateTime) {
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
      } else {
        // 예약 생성
        const { error } = await supabase.rpc("create_cabin_reservation", {
          cabin_uuid: cabinId,
          reservation_start_time: startDateTime.toISOString(),
          reservation_end_time: endDateTime.toISOString(),
          reservation_purpose: formData.purpose.trim(),
        });

        if (error) throw error;
      }

      clearSelection();
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("ships.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isModal ? "p-6" : ""}>
      <div className="space-y-2">
        {/* 날짜 선택 */}
        <div>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min={today} // 오늘 이후만 선택 가능 (로컬 기준)
            className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            required
          />
        </div>

        {error && <ErrorMessage message={error} />}

        {/* 버튼 */}
        <div>
          <Button
            type="button"
            size="md"
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
  );
}
