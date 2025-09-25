"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ReservationForm } from "@/components/ReservationForm";
import { ReservationItem } from "@/components/ReservationItem";
import { CabinReservationSummary } from "@/components/CabinReservationSummary";
import { ShipTabs } from "@/components/ShipTabs";
import { ShipCabin, Ship, CabinReservation } from "@/types/database";
import { calculateCabinStatus } from "@/lib/cabin-status";
import { renderTextWithLinks } from "@/lib/text-helpers";

export default function CabinDetail() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();

  const [ship, setShip] = useState<Ship | null>(null);
  const [cabin, setCabin] = useState<ShipCabin | null>(null);
  const [reservations, setReservations] = useState<CabinReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<
    "captain" | "mechanic" | "crew" | null
  >(null);
  const [showReservationForm, setShowReservationForm] = useState(false);

  const shipPublicId = params.public_id as string;
  const cabinPublicId = params.cabin_public_id as string;

  useEffect(() => {
    if (!profileLoading && shipPublicId && cabinPublicId) {
      fetchCabinDetails();
    }
  }, [profileLoading, shipPublicId, cabinPublicId]);

  // URL 쿼리 파라미터 처리
  useEffect(() => {
    const reserveParam = searchParams.get("reserve");
    if (reserveParam === "true") {
      setShowReservationForm(true);
    }
  }, [searchParams]);

  // Realtime 구독은 cabin이 로드된 후에 설정
  useEffect(() => {
    if (!cabin) return;

    const channel = supabase
      .channel("cabin-reservations-detail")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cabin_reservations",
          filter: `cabin_id=eq.${cabin.id}`,
        },
        (payload) => {
          // 예약 변경 시 데이터 새로고침
          fetchCabinDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cabin]);

  const fetchCabinDetails = async () => {
    if (!shipPublicId || !cabinPublicId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 배 정보 조회
      const { data: shipData, error: shipError } = await supabase
        .from("ships")
        .select("*")
        .eq("public_id", shipPublicId)
        .maybeSingle();

      if (shipError) {
        throw shipError;
      }

      if (!shipData) {
        throw new Error(t("ships.shipNotFound"));
      }

      setShip(shipData);

      // 선실 정보 조회
      const { data: cabinData, error: cabinError } = await supabase
        .from("ship_cabins")
        .select("*")
        .eq("public_id", cabinPublicId)
        .eq("ship_id", shipData.id)
        .maybeSingle();

      if (cabinError) {
        throw cabinError;
      }

      if (!cabinData) {
        throw new Error(t("ships.cabinNotFound"));
      }

      setCabin(cabinData);

      // 예약 목록 조회 (모든 confirmed 예약)
      const { data: reservationsData, error: reservationsError } =
        await supabase
          .from("cabin_reservations")
          .select("*")
          .eq("cabin_id", cabinData.id)
          .eq("status", "confirmed")
          .order("start_time", { ascending: true });

      if (reservationsError) {
        throw reservationsError;
      }

      setReservations(reservationsData || []);

      // 사용자 역할 조회 (로그인된 경우)
      if (profile) {
        const { data: memberData } = await supabase
          .from("ship_members")
          .select("role")
          .eq("ship_id", shipData.id)
          .eq("user_id", profile.id)
          .maybeSingle();

        setUserRole(memberData?.role || null);
      }
    } catch (err: any) {
      console.error("Failed to fetch cabin details:", err);
      setError(err.message || t("ships.errorLoadingCabin"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReservationSuccess = () => {
    setShowReservationForm(false);
    fetchCabinDetails(); // 예약 목록 새로고침
  };

  // 예약을 카테고리별로 분류
  const categorizeReservations = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todayReservations: CabinReservation[] = [];
    const upcomingReservations: CabinReservation[] = [];
    const pastReservations: CabinReservation[] = [];

    reservations.forEach((reservation) => {
      if (reservation.status !== "confirmed") return;

      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);
      const reservationDate = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      // 오늘의 예약 (현재 진행중인 것과 오늘 예정된 것 모두 포함)
      if (reservationDate.getTime() === today.getTime()) {
        // 이미 종료된 오늘 예약은 과거로
        if (end <= now) {
          pastReservations.push(reservation);
        } else {
          todayReservations.push(reservation);
        }
      }
      // 오늘 이후의 예약
      else if (start > now) {
        upcomingReservations.push(reservation);
      } else if (end <= now || reservationDate.getTime() < today.getTime()) {
        // 과거 예약 (종료가 현재 이전이거나 날짜가 오늘보다 이전)
        pastReservations.push(reservation);
      }
    });

    return {
      todayReservations,
      upcomingReservations,
      pastReservations,
    };
  };

  const { todayReservations, upcomingReservations, pastReservations } =
    categorizeReservations();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "past">(
    "today"
  );

  const tabs = [
    {
      id: "today",
      label: t("ships.todayReservations"),
      content: (
        <div>
          {todayReservations.length > 0 ? (
            <div className="space-y-4">
              {todayReservations.map((reservation) => {
                const now = new Date();
                const start = new Date(reservation.start_time);
                const end = new Date(reservation.end_time);
                const isCurrent = now >= start && now < end;

                return (
                  <ReservationItem
                    key={reservation.id}
                    reservation={reservation}
                    currentUserId={profile?.id}
                    userRole={userRole || undefined}
                    onUpdate={fetchCabinDetails}
                    isCurrent={isCurrent}
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
                  currentUserId={profile?.id}
                  userRole={userRole || undefined}
                  onUpdate={fetchCabinDetails}
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
        <div>
          {pastReservations.length > 0 ? (
            <div>
              {(userRole === "captain" || userRole === "mechanic") && (
                <div className="mb-3 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (
                        !confirm(t("ships.confirmDeleteAllPastReservations"))
                      ) {
                        return;
                      }
                      try {
                        const supabase = createClient();
                        const ids = pastReservations.map((r) => r.id);
                        if (ids.length === 0) return;
                        const { error: delError } = await supabase
                          .from("cabin_reservations")
                          .delete()
                          .in("id", ids);
                        if (delError) throw delError;
                        await fetchCabinDetails();
                        alert(t("ships.pastReservationsDeleted"));
                      } catch (e: any) {
                        console.error(e);
                        alert(t("ships.errorDeletingReservations"));
                      }
                    }}
                  >
                    {t("ships.deleteAllPastReservations")}
                  </Button>
                </div>
              )}
              <div className="space-y-4">
                {pastReservations
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.start_time).getTime() -
                      new Date(a.start_time).getTime()
                  )
                  .map((reservation) => (
                    <ReservationItem
                      key={reservation.id}
                      reservation={reservation}
                      currentUserId={profile?.id}
                      userRole={userRole || undefined}
                      onUpdate={fetchCabinDetails}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-sm text-muted-foreground">
                {t("ships.noPastReservations")}
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (profileLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!ship || !cabin) {
    return <ErrorMessage message={t("ships.cabinNotFound")} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          {
            label: ship.name,
            onClick: () => router.push(`/${locale}/ship/${shipPublicId}`),
          },
          {
            label: t("cabins.viewAllCabins"),
            onClick: () =>
              router.push(`/${locale}/ship/${shipPublicId}/cabins`),
          },
          {
            label: cabin.name,
            isCurrentPage: true,
          },
        ]}
      />

      {/* 메인 컨텐츠 - 좌우 분할 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽 - cabin 정보 + 예약폼 */}
        <div className="space-y-8">
          {/* cabin 정보 */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {cabin.name}
                </h1>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    calculateCabinStatus(reservations).status === "available"
                      ? "bg-success-600 text-success-foreground"
                      : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {calculateCabinStatus(reservations).status === "available"
                    ? t("ships.available")
                    : t("ships.inUse")}
                </span>
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
          <div>
            <div className="flex items-center justify-between mb-6">
              {/* <h2 className="text-2xl font-bold text-foreground">
                {t("ships.createReservation")}
              </h2> */}
              <Button
                className="w-full"
                type="button"
                variant={showReservationForm ? "secondary" : "primary"}
                size="md"
                onClick={() => setShowReservationForm(!showReservationForm)}
              >
                {showReservationForm
                  ? t("ships.cancelReservation")
                  : t("ships.reserveCabin")}
              </Button>
            </div>

            {showReservationForm && (
              <ReservationForm
                cabinId={cabin.id}
                onSuccess={handleReservationSuccess}
                existingReservations={reservations}
                isModal={false}
              />
            )}
          </div>
        </div>

        {/* 오른쪽 - 예약 탭 (ShipTabs 스타일 사용) */}
        <div>
          <ShipTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) =>
              setActiveTab(id as "today" | "upcoming" | "past")
            }
          />
        </div>
      </div>
    </div>
  );
}
