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
  onCancel: () => void;
  existingReservations?: CabinReservation[];
}

export function ReservationForm({
  cabinId,
  onSuccess,
  onCancel,
  existingReservations = [],
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

  // 프로필이 로드되면 purpose 기본값 설정
  useEffect(() => {
    if (profile?.display_name && !formData.purpose) {
      setFormData((prev) => ({
        ...prev,
        purpose: `${profile.display_name}의 예약`,
      }));
    }
  }, [profile, formData.purpose]);

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

    // 시간 검증
    const startDateTime = new Date(`${formData.date}T${selectedStartTime}`);
    const endDateTime = new Date(`${formData.date}T${selectedEndTime}`);
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
    <div className="bg-muted rounded-lg p-6 border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-6">
        {t("ships.createReservation")}
      </h3>

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
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            required
          />
        </div>

        {error && <ErrorMessage message={error} />}

        {/* 버튼들 */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isLoading}
            onClick={handleCreateReservation}
            className="flex-1"
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
