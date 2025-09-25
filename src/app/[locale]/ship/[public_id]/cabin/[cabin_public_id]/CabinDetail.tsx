"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { CabinInfo } from "@/components/CabinInfo";
import { ReservationTabs } from "@/components/ReservationTabs";
import { ShipCabin, Ship, CabinReservation } from "@/types/database";

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
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

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

  // 실시간 상태 업데이트를 위한 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, []);

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
          console.log("Realtime update received:", payload);
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
            label: (
              <span className="flex items-center gap-2">
                {ship.name}
                {userRole && <RoleBadge role={userRole} size="sm" />}
              </span>
            ),
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
        <div>
          <CabinInfo
            cabin={cabin}
            reservations={reservations}
            todayReservations={todayReservations}
            showReservationForm={showReservationForm}
            onToggleReservationForm={() => setShowReservationForm(!showReservationForm)}
            onReservationSuccess={handleReservationSuccess}
            lastUpdateTime={lastUpdateTime}
          />
        </div>

        {/* 오른쪽 - 예약 탭 */}
        <div>
          <ReservationTabs
            todayReservations={todayReservations}
            upcomingReservations={upcomingReservations}
            cabinId={cabin.id}
            currentUserId={profile?.id}
            userRole={userRole || undefined}
            existingReservations={reservations}
            onUpdate={fetchCabinDetails}
          />
        </div>
      </div>
    </div>
  );
}
