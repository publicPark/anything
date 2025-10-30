"use client";

import { Button } from "@/components/ui/Button";
import { CabinReservationSummary } from "@/components/CabinReservationSummary";
import { ShipCabin, CabinReservation } from "@/types/database";
import dynamic from "next/dynamic";

const ReservationForm = dynamic(
  () =>
    import("@/components/ReservationForm").then((mod) => ({
      default: mod.ReservationForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">
          Loading reservation form...
        </div>
      </div>
    ),
  }
);
import { calculateCabinStatus } from "@/lib/cabin-status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { renderTextWithLinks } from "@/lib/text-helpers";
import { useI18n } from "@/hooks/useI18n";

interface CabinInfoProps {
  cabin: ShipCabin;
  reservations: CabinReservation[];
  todayReservations: CabinReservation[];
  showReservationForm: boolean;
  showButton?: boolean;
  onToggleReservationForm: () => void;
  onReservationSuccess: () => void;
  lastUpdateTime?: Date;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  onMonthChange?: (activeStartDate: Date) => void;
  isCalendarLoading?: boolean;
}

export function CabinInfo({
  cabin,
  reservations,
  todayReservations,
  showReservationForm,
  showButton = false,
  onToggleReservationForm,
  onReservationSuccess,
  lastUpdateTime,
  selectedDate,
  onDateChange,
  onMonthChange,
  isCalendarLoading,
}: CabinInfoProps) {
  const { t } = useI18n();

  // 실시간 상태 계산 (lastUpdateTime이 변경될 때마다 재계산)
  const cabinStatus = calculateCabinStatus(reservations);

  return (
    <div className="space-y-8">
      {/* Cabin 정보 */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{cabin.name}</h1>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge
                label={
                  cabinStatus.status === "available"
                    ? t("ships.available")
                    : t("ships.inUse")
                }
                tone={
                  cabinStatus.status === "available" ? "success" : "destructive"
                }
                blinking={cabinStatus.status !== "available"}
                className="px-3 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        {cabin.description && (
          <p className="text-foreground mb-6 whitespace-pre-wrap text-sm">
            {renderTextWithLinks(cabin.description)}
          </p>
        )}

        {/* 오늘의 예약 요약 */}
        <CabinReservationSummary reservations={todayReservations} />
      </div>

      {/* 예약 폼 */}
      {showReservationForm && <hr className="border-border" />}
      <div className="mb-6">
        {showButton && (
          <div className="flex items-center justify-between mb-4">
            <Button
              className="w-full"
              type="button"
              variant={showReservationForm ? "secondary" : "primary"}
              size="lg"
              onClick={onToggleReservationForm}
            >
              {showReservationForm
                ? t("ships.cancelReservation")
                : t("ships.reserveCabin")}
            </Button>
          </div>
        )}

        {showReservationForm && (
          <ReservationForm
            key="reservation-form"
            cabinId={cabin.id}
            onSuccess={onReservationSuccess}
            existingReservations={reservations}
            isModal={false}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            onMonthChange={onMonthChange}
            isCalendarLoading={isCalendarLoading}
          />
        )}
      </div>
    </div>
  );
}
