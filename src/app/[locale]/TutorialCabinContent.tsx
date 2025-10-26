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
  const [showReservationForm, setShowReservationForm] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reservations, setReservations] = useState(cabinData.reservations);

  const { ship, cabin } = cabinData;

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
    // 예약 성공 후 예약 목록만 업데이트 (폼은 계속 표시)
    fetchUpdatedReservations();
  };

  const handleUpdate = () => {
    // 예약 목록을 다시 가져와서 업데이트
    fetchUpdatedReservations();
  };

  const fetchUpdatedReservations = async () => {
    try {
      // Supabase 클라이언트를 사용해서 최신 예약 목록을 가져오기
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      const { data: reservations, error } = await supabase
        .from("cabin_reservations")
        .select("*")
        .eq("cabin_id", cabin.id)
        .eq("status", "confirmed")
        .order("start_time", { ascending: true });

      if (error) {
        console.error('Failed to fetch updated reservations:', error);
        return;
      }

      setReservations(reservations || []);
    } catch (error) {
      console.error('Failed to fetch updated reservations:', error);
    }
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
            onUpdate={handleUpdate}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}
