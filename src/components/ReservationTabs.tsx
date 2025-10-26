"use client";

import { useState, useEffect, useMemo } from "react";
import { ShipTabs } from "@/components/ShipTabs";
import { ReservationItem } from "@/components/ReservationItem";
import { PastReservations } from "@/components/PastReservations";
import { CabinReservation } from "@/types/database";
import { useI18n } from "@/hooks/useI18n";

interface ReservationTabsProps {
  todayReservations: CabinReservation[];
  upcomingReservations: CabinReservation[];
  cabinId: string;
  currentUserId?: string;
  userRole?: "captain" | "mechanic" | "crew";
  existingReservations: CabinReservation[];
  onUpdate: () => void;
  selectedDate?: string;
  newlyCreatedReservationId?: string | null;
}

export function ReservationTabs({
  todayReservations,
  upcomingReservations,
  cabinId,
  currentUserId,
  userRole,
  existingReservations,
  onUpdate,
  selectedDate,
  newlyCreatedReservationId,
}: ReservationTabsProps) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<"selected" | "past">("selected");
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 선택된 날짜의 예약 필터링
  const getSelectedDateReservations = () => {
    if (!selectedDate) return todayReservations; // 기본값으로 오늘 예약

    const selectedDateObj = new Date(selectedDate);
    const selectedDateOnly = new Date(
      selectedDateObj.getFullYear(),
      selectedDateObj.getMonth(),
      selectedDateObj.getDate()
    );

    return existingReservations.filter((reservation) => {
      if (reservation.status !== "confirmed") return false;
      const reservationDate = new Date(reservation.start_time);
      const reservationDateOnly = new Date(
        reservationDate.getFullYear(),
        reservationDate.getMonth(),
        reservationDate.getDate()
      );
      return reservationDateOnly.getTime() === selectedDateOnly.getTime();
    });
  };

  const handleReservationUpdate = () => {
    onUpdate();
  };

  // 로컬 타임존 기준 YYYY-MM-DD 생성
  const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedDateReservations = getSelectedDateReservations();
  const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date();
  const today = new Date();
  const todayStr = getLocalYYYYMMDD(today);
  const isToday = selectedDate === todayStr;

  // 예약 목록을 메모이제이션하여 불필요한 리렌더링 방지
  const reservationItems = useMemo(() => {
    return selectedDateReservations.map((reservation) => {
      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);
      const isCurrent = currentTime >= start && currentTime < end;

      return (
        <ReservationItem
          key={reservation.id}
          reservation={reservation}
          currentUserId={currentUserId}
          userRole={userRole}
          onUpdate={handleReservationUpdate}
          isCurrent={isCurrent}
          cabinId={cabinId}
          existingReservations={existingReservations}
          isNewlyCreated={newlyCreatedReservationId === reservation.id}
        />
      );
    });
  }, [selectedDateReservations, currentTime, currentUserId, userRole, handleReservationUpdate, cabinId, existingReservations, newlyCreatedReservationId]);

  const tabs = [
    {
      id: "selected",
      label: t("ships.selectedDateReservations", {
        date:
          selectedDateObj.toLocaleDateString(
            locale === "ko" ? "ko-KR" : "en-US",
            {
              month: "short",
              day: "numeric",
            }
          ) + (isToday ? ` (${t("common.today")})` : ""),
      }),
      content: (
        <div>
          {selectedDateReservations.length > 0 ? (
            <div className="space-y-4 mb-4">
              {reservationItems}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm text-muted-foreground">
                {t("ships.noReservations")}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "past",
      label: t("ships.pastReservations"),
      content: (
        <PastReservations
          cabinId={cabinId}
          currentUserId={currentUserId}
          userRole={userRole}
          existingReservations={existingReservations}
          onUpdate={onUpdate}
        />
      ),
    },
  ];

  return (
    <ShipTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as "selected" | "past")}
    />
  );
}
