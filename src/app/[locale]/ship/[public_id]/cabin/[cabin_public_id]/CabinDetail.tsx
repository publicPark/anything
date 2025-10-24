"use client";

import { useState, useEffect, useCallback } from "react";
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

interface CabinDetailProps {
  showBreadcrumb?: boolean;
}

export default function CabinDetail({ showBreadcrumb = true }: CabinDetailProps = {}) {
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
  const [showReservationForm, setShowReservationForm] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const shipPublicId = params.public_id as string;
  const cabinPublicId = params.cabin_public_id as string;

  const fetchCabinDetails = useCallback(async () => {
    if (!shipPublicId || !cabinPublicId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 병렬로 배 정보와 선실 정보 조회
      const [shipResult, cabinResult] = await Promise.all([
        supabase
          .from("ships")
          .select("*")
          .eq("public_id", shipPublicId)
          .maybeSingle(),
        supabase
          .from("ship_cabins")
          .select("*")
          .eq("public_id", cabinPublicId)
          .maybeSingle(),
      ]);

      if (shipResult.error) {
        throw shipResult.error;
      }

      if (cabinResult.error) {
        throw cabinResult.error;
      }

      const shipData = shipResult.data;
      const cabinData = cabinResult.data;

      if (!shipData) {
        throw new Error("Ship not found");
      }

      if (!cabinData) {
        throw new Error("Cabin not found");
      }

      // 선실이 해당 배에 속하는지 확인
      if (cabinData.ship_id !== shipData.id) {
        throw new Error("Cabin not found");
      }

      setShip(shipData);
      setCabin(cabinData);

      // 예약 목록과 사용자 역할을 병렬로 조회
      const [reservationsResult, memberResult] = await Promise.all([
        supabase
          .from("cabin_reservations")
          .select("*")
          .eq("cabin_id", cabinData.id)
          .eq("status", "confirmed")
          .order("start_time", { ascending: true }),
        profile?.id
          ? supabase
              .from("ship_members")
              .select("role")
              .eq("ship_id", shipData.id)
              .eq("user_id", profile.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (reservationsResult.error) {
        throw reservationsResult.error;
      }

      setReservations(reservationsResult.data || []);

      if (memberResult.data) {
        setUserRole(memberResult.data.role || null);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch cabin details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load cabin details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [shipPublicId, cabinPublicId, profile?.id]);

  useEffect(() => {
    if (shipPublicId && cabinPublicId) {
      fetchCabinDetails();
    }
  }, [shipPublicId, cabinPublicId, fetchCabinDetails]);

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
    }, 30000); // 30초마다 업데이트로 변경하여 성능 개선

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
  }, [cabin, fetchCabinDetails]);

  // 예약 목록만 업데이트하는 함수 (등록/수정/삭제 시 사용)
  const fetchReservationsOnly = async () => {
    if (!cabin) return;

    try {
      const { data: reservationsData, error: reservationsError } =
        await supabase
          .from("cabin_reservations")
          .select("*")
          .eq("cabin_id", cabin.id)
          .eq("status", "confirmed")
          .order("start_time", { ascending: true });

      if (reservationsError) {
        console.error("Failed to fetch reservations:", reservationsError);
        return;
      }

      setReservations(reservationsData || []);
    } catch (err) {
      console.error("Failed to update reservations:", err);
    }
  };

  const handleReservationSuccess = () => {
    // setShowReservationForm(false);
    fetchReservationsOnly(); // 예약 목록만 새로고침 (더 가벼움)
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

  if (!ship || !cabin) {
    return <ErrorMessage message="Cabin not found" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Breadcrumbs - 조건부 표시 */}
      {showBreadcrumb && (
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
      )}

      {/* 메인 컨텐츠 - 좌우 분할 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽 - cabin 정보 + 예약폼 */}
        <div>
          <CabinInfo
            cabin={cabin}
            reservations={reservations}
            todayReservations={todayReservations}
            showReservationForm={showReservationForm}
            onToggleReservationForm={() =>
              setShowReservationForm(!showReservationForm)
            }
            onReservationSuccess={handleReservationSuccess}
            lastUpdateTime={lastUpdateTime}
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
            currentUserId={profile?.id}
            userRole={userRole || undefined}
            existingReservations={reservations}
            onUpdate={fetchReservationsOnly}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}
