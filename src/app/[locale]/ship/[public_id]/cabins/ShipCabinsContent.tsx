"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CabinList } from "@/components/CabinList";
import { CabinManage } from "@/components/CabinManage";
import { ShipTabs } from "@/components/ShipTabs";
import { Ship } from "@/types/database";
import { CabinWithStatus } from "@/lib/cabin-status";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RoleBadge } from "@/components/ui/RoleBadge";
import {
  addStatusToCabins,
  groupReservationsByCabinId,
} from "@/lib/cabin-status";

interface ShipCabinsContentProps {
  shipPublicId: string;
  preloadedData: {
    ship: Ship | null;
    cabins: CabinWithStatus[];
    userRole: "captain" | "mechanic" | "crew" | null;
  };
}

export function ShipCabinsContent({ shipPublicId, preloadedData }: ShipCabinsContentProps) {
  const { t, locale } = useI18n();
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  // SSR 데이터로 초기화
  const [ship, setShip] = useState<Ship | null>(preloadedData.ship);
  const [cabins, setCabins] = useState<CabinWithStatus[]>(preloadedData.cabins);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"captain" | "mechanic" | "crew" | null>(
    preloadedData.userRole
  );
  const [activeTab, setActiveTab] = useState<string>("viewCabins");

  // Realtime 구독 - 예약 변경사항 감지
  useEffect(() => {
    if (!ship) return;

    const channel = supabase
      .channel("cabin-reservations-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cabin_reservations",
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          // 예약 변경 시 데이터 새로고침
          fetchCabins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ship]);

  const fetchCabins = useCallback(async () => {
    if (!ship) return;

    try {
      const supabase = createClient();
      
      // 오늘 날짜 범위 계산
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );

      // 예약 정보 조회
      const { data: reservations, error: reservationsError } = await supabase
        .from("cabin_reservations")
        .select("*")
        .eq("status", "confirmed")
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .order("start_time", { ascending: true });

      if (reservationsError) throw reservationsError;

      // 상태 정보 추가
      const reservationsByCabinId = groupReservationsByCabinId(reservations || []);
      const cabinsWithStatus = addStatusToCabins(cabins, reservationsByCabinId);

      setCabins(cabinsWithStatus);
    } catch (err: unknown) {
      console.error("Failed to fetch cabins:", err);
    }
  }, [ship, cabins]);

  // 탭 생성 함수 - 정비공 이상만 탭 표시
  const createTabs = useCallback(() => {
    if (!ship) return [];

    // 정비공 이상만 탭 사용
    if (userRole === "captain" || userRole === "mechanic") {
      return [
        {
          id: "viewCabins",
          label: t("ships.shipCabinsList"),
          content: (
            <div className="space-y-6">
              <CabinList 
                shipId={ship.id} 
                shipPublicId={shipPublicId}
                preloadedCabins={cabins}
              />
            </div>
          ),
        },
        {
          id: "manageCabins",
          label: t("ships.cabinsManage"),
          content: (
            <div className="space-y-6">
              <CabinManage shipId={ship.id} userRole={userRole} />
            </div>
          ),
        },
      ];
    }

    return [];
  }, [ship, userRole, t, shipPublicId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!ship) {
    return <ErrorMessage message={t("ships.shipNotFound")} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          {
            label: (
              <span className="flex items-center gap-2">
                <b>{ship.name}</b>
                {userRole && <RoleBadge role={userRole} size="sm" />}
              </span>
            ),
            onClick: () => router.push(`/${locale}/ship/${shipPublicId}`),
          },
          {
            label: t("ships.shipCabinsList"),
            isCurrentPage: true,
          },
        ]}
      />

      {/* 배 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 sr-only">
          <b>{ship.name}</b>
          {t("ships.shipCabinsList")}
        </h1>
        {/* {ship.description && (
          <p className="text-foreground text-sm">{ship.description}</p>
        )} */}
      </div>

      {/* 정비공 이상만 탭 표시, 일반 사용자는 선실 목록만 */}
      {createTabs().length > 0 ? (
        <ShipTabs
          tabs={createTabs()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : (
        <CabinList 
          shipId={ship.id} 
          shipPublicId={shipPublicId}
          preloadedCabins={cabins}
        />
      )}
    </div>
  );
}
