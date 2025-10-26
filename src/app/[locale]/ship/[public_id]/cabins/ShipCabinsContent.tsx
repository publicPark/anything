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
import { ShareButton } from "@/components/ShareButton";
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
  const [shareUrl, setShareUrl] = useState<string>("");

  // SSR 데이터로 초기화
  const [ship, setShip] = useState<Ship | null>(preloadedData.ship);
  const [cabins, setCabins] = useState<CabinWithStatus[]>(preloadedData.cabins);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"captain" | "mechanic" | "crew" | null>(
    preloadedData.userRole
  );
  const [activeTab, setActiveTab] = useState<string>("viewCabins");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // 클라이언트에서 공유 URL 생성
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/${locale}/ship/${shipPublicId}/cabins`);
    }
  }, [locale, shipPublicId]);

  // 실시간 구독 비활성화 - 수동 새로고침 사용
  // useEffect(() => {
  //   // 실시간 구독이 작동하지 않으므로 비활성화
  //   // 수동 새로고침 버튼을 사용하여 데이터 업데이트
  // }, [ship]);


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
                refreshTrigger={refreshTrigger}
              />
            </div>
          ),
        },
        {
          id: "manageCabins",
          label: t("ships.cabinsManage"),
          content: (
            <div className="space-y-6">
              <CabinManage 
                shipId={ship.id} 
                userRole={userRole}
              />
            </div>
          ),
        },
      ];
    }

    return [];
  }, [ship, userRole, t, shipPublicId]);

  // 탭 변경 핸들러
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "viewCabins") {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    setRefreshTrigger(prev => prev + 1);
  };

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
      {/* Breadcrumbs and Actions */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            className="mb-0"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </Button>
            {/* <ShareButton
              url={shareUrl}
              title={`${ship.name} - ${t("ships.shipCabinsList")}`}
              description={ship.description || t("ships.shipCabinsDescription").replace("{shipName}", ship.name)}
              className="flex-shrink-0"
            /> */}
          </div>
        </div>
      </div>

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
          onTabChange={handleTabChange}
        />
      ) : (
        <CabinList 
          shipId={ship.id} 
          shipPublicId={shipPublicId}
          preloadedCabins={cabins}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}
