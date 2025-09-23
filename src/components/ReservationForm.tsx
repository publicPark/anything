"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ReservationFormProps {
  cabinId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReservationForm({
  cabinId,
  onSuccess,
  onCancel,
}: ReservationFormProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.date ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.purpose.trim()
    ) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    // 날짜와 시간을 결합하여 ISO 문자열 생성
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    // 종료 시간이 시작 시간보다 늦은지 확인
    if (endDateTime <= startDateTime) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc("create_cabin_reservation", {
        cabin_uuid: cabinId,
        reservation_start_time: startDateTime.toISOString(),
        reservation_end_time: endDateTime.toISOString(),
        reservation_purpose: formData.purpose.trim(),
      });

      if (error) {
        throw error;
      }

      onSuccess();
    } catch (err: any) {
      console.error("Failed to create reservation:", err);
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
            required
          />
        </div>

        {/* 시작 시간 */}
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {t("ships.startTime")}
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* 종료 시간 */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {t("ships.endTime")}
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
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
            type="submit"
            variant="primary"
            disabled={isLoading}
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
      </form>
    </div>
  );
}
