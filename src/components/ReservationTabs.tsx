"use client";

import { useState, useEffect } from "react";
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
}: ReservationTabsProps) {
  const { t } = useI18n();
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

  const selectedDateReservations = getSelectedDateReservations();
  const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isToday = selectedDate === todayStr;

  const tabs = [
    {
      id: "selected",
      label: t("ships.selectedDateReservations", {
        date:
          selectedDateObj.toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          }) + (isToday ? " (오늘)" : ""),
      }),
      content: (
        <div>
          {selectedDateReservations.length > 0 ? (
            <div className="space-y-4 mb-4">
              {selectedDateReservations.map((reservation) => {
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
                  />
                );
              })}
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
