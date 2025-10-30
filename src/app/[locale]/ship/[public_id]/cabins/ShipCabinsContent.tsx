"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CabinList, CabinListHandle } from "@/components/CabinList";
import { CabinManage } from "@/components/CabinManage";
import { ShipTabs } from "@/components/ShipTabs";
import { Ship } from "@/types/database";
import { CabinWithStatus } from "@/lib/cabin-status";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { useToast } from "@/components/ui/Toast";
interface ShipCabinsContentProps {
  shipPublicId: string;
  preloadedData: {
    ship: Ship | null;
    cabins: CabinWithStatus[];
    userRole: "captain" | "mechanic" | "crew" | null;
  };
}

export function ShipCabinsContent({
  shipPublicId,
  preloadedData,
}: ShipCabinsContentProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cabinListRef = useRef<CabinListHandle | null>(null);

  // SSR 데이터로 초기화
  const [ship, setShip] = useState<Ship | null>(preloadedData.ship);
  const [cabins, setCabins] = useState<CabinWithStatus[]>(preloadedData.cabins);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<
    "captain" | "mechanic" | "crew" | null
  >(preloadedData.userRole);
  const [activeTab, setActiveTab] = useState<string>("viewCabins");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const toast = useToast();
  const [showTimezoneButton, setShowTimezoneButton] = useState(false);
  const [browserTz, setBrowserTz] = useState<string>("");

  // 클라이언트에서 브라우저 타임존 결정
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        setBrowserTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
      } catch {
        setBrowserTz("");
      }
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
                ref={cabinListRef}
                shipId={ship.id}
                shipPublicId={shipPublicId}
                preloadedCabins={cabins}
                refreshTrigger={refreshTrigger}
                shipTimeZone={ship.time_zone}
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

  // 탭 변경 핸들러
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "viewCabins") {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  // TZ 버튼 표시 여부는 클라이언트 마운트 후에만 계산하여 SSR/CSR 불일치 방지
  useEffect(() => {
    const shipTz = ship?.time_zone || "";
    setShowTimezoneButton(Boolean(shipTz && browserTz && shipTz !== browserTz));
  }, [ship?.time_zone, browserTz]);

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    cabinListRef.current?.refresh();
  };

  // 타임존 토스트 표시
  const handleShowTimezones = () => {
    try {
      const currentBrowserTz = browserTz || "UTC";
      const shipTz = ship?.time_zone;
      const getTimeZoneOffsetString = (timeZone: string) => {
        try {
          const dtf = new Intl.DateTimeFormat("en-US", {
            timeZone,
            timeZoneName: "shortOffset",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const parts = dtf.formatToParts(new Date());
          const tzPart = parts.find((p) => p.type === "timeZoneName");
          return tzPart?.value || ""; // e.g., GMT+9
        } catch {
          return "";
        }
      };

      const shipOffset = shipTz ? getTimeZoneOffsetString(shipTz) : "";
      const browserOffset = currentBrowserTz
        ? getTimeZoneOffsetString(currentBrowserTz)
        : "";
      const relationLine =
        shipOffset && browserOffset
          ? `(${shipOffset} ${
              shipOffset === browserOffset ? "=" : "≠"
            } ${browserOffset})`
          : null;

      const message = [
        shipTz ? `${t("common.team")}: ${shipTz}` : null,
        currentBrowserTz ? `${t("common.local")}: ${currentBrowserTz}` : null,
        relationLine,
      ]
        .filter(Boolean)
        .join("\n");

      if (message) {
        toast.info(message);
      }
    } catch (e) {
      // 안전하게 무시
    }
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </Button>
            {showTimezoneButton && (
              <Button
                onClick={handleShowTimezones}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                aria-label={t("common.timezones")}
                title={t("common.timezones")}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0c2.5 2.2 2.5 15.8 0 18m0-18c-2.5 2.2-2.5 15.8 0 18M3 12h18"
                  />
                </svg>
                <span className="hidden sm:inline">TZ</span>
              </Button>
            )}
            {/* Share button intentionally removed */}
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
          ref={cabinListRef}
          shipId={ship.id}
          shipPublicId={shipPublicId}
          preloadedCabins={cabins}
          refreshTrigger={refreshTrigger}
          shipTimeZone={ship.time_zone}
        />
      )}
    </div>
  );
}
