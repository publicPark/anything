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
}

export function ReservationTabs({
  todayReservations,
  upcomingReservations,
  cabinId,
  currentUserId,
  userRole,
  existingReservations,
  onUpdate,
}: ReservationTabsProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "past">("today");
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReservationUpdate = () => {
    onUpdate();
  };

  const tabs = [
    {
      id: "today",
      label: t("ships.todayReservations"),
      content: (
        <div>
          {todayReservations.length > 0 ? (
            <div className="space-y-4">
              {todayReservations.map((reservation) => {
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
                {t("ships.noTodayReservations")}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "upcoming",
      label: t("ships.upcomingReservations"),
      content: (
        <div>
          {upcomingReservations.length > 0 ? (
            <div className="space-y-4">
              {upcomingReservations.map((reservation) => (
                <ReservationItem
                  key={reservation.id}
                  reservation={reservation}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onUpdate={handleReservationUpdate}
                  cabinId={cabinId}
                  existingReservations={existingReservations}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🔮</div>
              <p className="text-sm text-muted-foreground">
                {t("ships.noUpcomingReservations")}
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
      onTabChange={(id) => setActiveTab(id as "today" | "upcoming" | "past")}
    />
  );
}
