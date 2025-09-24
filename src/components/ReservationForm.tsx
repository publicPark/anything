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
}

export function ReservationForm({
  cabinId,
  onSuccess,
  existingReservations = [],
  isModal = false,
}: ReservationFormProps) {
  const { t } = useI18n();
  const { profile } = useProfile();
  const { selectedStartTime, selectedEndTime, clearSelection } =
    useReservationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split("T")[0];

  // 폼 데이터
  const [formData, setFormData] = useState({
    date: today,
    purpose: profile?.display_name ? `${profile.display_name}의 예약` : "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
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
      setError("모든 필드를 입력해주세요.");
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

    if (endDateTime <= startDateTime) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_cabin_reservation", {
        cabin_uuid: cabinId,
        reservation_start_time: startDateTime.toISOString(),
        reservation_end_time: endDateTime.toISOString(),
        reservation_purpose: formData.purpose.trim(),
      });

      if (error) throw error;

      clearSelection();
      onSuccess();
    } catch (err: any) {
      setError(err.message || t("ships.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isModal ? "p-6" : ""}>
      <div className="space-y-4">
        {/* 날짜 선택 */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {t("ships.selectDate")}
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min={new Date().toISOString().split("T")[0]} // 오늘 이후만 선택 가능
            className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 시간 선택 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t("ships.selectTime")}
          </label>
          <TimeTable
            selectedDate={formData.date}
            reservations={existingReservations}
          />
        </div>

        {/* 예약 목적 */}
        <div>
          <label
            htmlFor="purpose"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {t("ships.reservationPurpose")}
          </label>
          <textarea
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            placeholder={t("ships.reservationPurposePlaceholder")}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            required
          />
        </div>

        {error && <ErrorMessage message={error} />}

        {/* 버튼 */}
        <div className="pt-4">
          <Button
            type="button"
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
            ) : (
              t("ships.createReservation")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
