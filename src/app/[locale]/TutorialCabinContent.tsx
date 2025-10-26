"use client";

import { useI18n } from "@/hooks/useI18n";
import { Ship, ShipCabin, CabinReservation } from "@/types/database";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { CabinInfo } from "@/components/CabinInfo";
import { ReservationTabs } from "@/components/ReservationTabs";
import { useState, useMemo } from "react";

interface TutorialCabinData {
  ship: Ship | null;
  cabin: ShipCabin | null;
  reservations: CabinReservation[];
}

interface TutorialCabinContentProps {
  cabinData: TutorialCabinData;
  locale: string;
}

export function TutorialCabinContent({ 
  cabinData, 
  locale 
}: TutorialCabinContentProps) {
  const { t } = useI18n();
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { ship, cabin, reservations } = cabinData;

  // 오늘과 이번 주 예약 분류 (Hook 규칙을 위해 early return 전에 호출)
  const { todayReservations, upcomingReservations } = useMemo(() => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return {
      todayReservations: reservations.filter((reservation) => {
        const reservationDate = new Date(reservation.start_time);
        return (
          reservationDate.getFullYear() === today.getFullYear() &&
          reservationDate.getMonth() === today.getMonth() &&
          reservationDate.getDate() === today.getDate()
        );
      }),
      upcomingReservations: reservations.filter((reservation) => {
        const reservationDate = new Date(reservation.start_time);
        return reservationDate >= today && reservationDate <= weekFromNow;
      }),
    };
  }, [reservations]);

  // 데이터가 없는 경우 에러 표시
  if (!ship || !cabin) {
    return (
      <ErrorMessage 
        message={t("errors.cabinNotFound")} 
      />
    );
  }

  const handleReservationSuccess = () => {
    // 튜토리얼에서는 실제 예약을 만들지 않으므로 폼만 닫기
    setShowReservationForm(false);
  };

  return (
    <div className="space-y-8">
      {/* 메인 컨텐츠 - 좌우 분할 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽 - cabin 정보 + 예약폼 */}
        <div>
          <CabinInfo
            cabin={cabin}
            reservations={reservations}
            todayReservations={todayReservations}
            showReservationForm={showReservationForm}
            showButton={true}
            onToggleReservationForm={() =>
              setShowReservationForm(!showReservationForm)
            }
            onReservationSuccess={handleReservationSuccess}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {/* 오른쪽 - 예약 탭 */}
        <div>
          <ReservationTabs
            todayReservations={todayReservations}
            upcomingReservations={upcomingReservations}
            cabinId={cabin.id}
            currentUserId={undefined} // 튜토리얼이므로 사용자 ID 없음
            userRole={undefined} // 튜토리얼이므로 사용자 역할 없음
            existingReservations={reservations}
            onUpdate={() => {}} // 튜토리얼에서는 업데이트 없음
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}
