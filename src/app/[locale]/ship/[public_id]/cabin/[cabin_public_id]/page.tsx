"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { ReservationForm } from "@/components/ReservationForm";
import { ReservationItem } from "@/components/ReservationItem";
import { ShipCabin, Ship, CabinReservation } from "@/types/database";
import { calculateCabinStatus } from "@/lib/cabin-status";
import { renderTextWithLinks } from "@/lib/text-helpers";

export default function CabinDetailPage() {
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

  const shipPublicId = params.public_id as string;
  const cabinPublicId = params.cabin_public_id as string;

  useEffect(() => {
    if (!profileLoading && shipPublicId && cabinPublicId) {
      fetchCabinDetails();
    }
  }, [profileLoading, shipPublicId, cabinPublicId]);

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

      // 예약 목록 조회 (현재 진행 중이거나 미래의 예약만)
      const now = new Date().toISOString();
      const { data: reservationsData, error: reservationsError } =
        await supabase
          .from("cabin_reservations")
          .select("*")
          .eq("cabin_id", cabinData.id)
          .eq("status", "confirmed")
          .gte("end_time", now) // 종료 시간이 현재 시간 이후인 예약만
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
    fetchCabinDetails(); // 예약 목록 새로고침
  };

  // 현재 사용중인 예약과 다음 예약 찾기
  const getCurrentAndNextReservations = () => {
    const now = new Date();
    const currentReservation = reservations.find((reservation) => {
      if (reservation.status !== "confirmed") return false;
      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);
      return now >= start && now < end;
    });

    const nextReservation = reservations.find((reservation) => {
      if (reservation.status !== "confirmed") return false;
      const start = new Date(reservation.start_time);
      return start > now;
    });

    return { currentReservation, nextReservation };
  };

  const { currentReservation, nextReservation } =
    getCurrentAndNextReservations();

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
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/${locale}/ship/${shipPublicId}/cabins`)}
        >
          {t("cabins.viewAllCabins", { shipName: ship.name })}
        </Button>
      </div>

      {/* 메인 컨텐츠 - 세로 배치 */}
      <div className="space-y-8">
        {/* 회의실 정보 - 좌우 분할 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽 - 회의실 기본 정보 */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
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
              <p className="text-foreground mb-6 whitespace-pre-wrap">
                {renderTextWithLinks(cabin.description)}
              </p>
            )}
          </div>

          {/* 오른쪽 - 현재/다음 예약 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t("ships.reservationStatus")}
            </h3>

            {/* 현재 사용중인 예약 */}
            {currentReservation ? (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  {t("ships.currentReservation")}
                </h4>
                <ReservationItem
                  reservation={currentReservation}
                  currentUserId={profile?.id}
                  userRole={userRole || undefined}
                  onUpdate={fetchCabinDetails}
                />
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm text-muted-foreground">
                  {t("ships.noCurrentReservation")}
                </p>
              </div>
            )}

            {/* 다음 예약 */}
            {nextReservation && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">
                  {t("ships.nextReservation")}
                </h4>
                <ReservationItem
                  reservation={nextReservation}
                  currentUserId={profile?.id}
                  userRole={userRole || undefined}
                  onUpdate={fetchCabinDetails}
                />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* 예약 폼 - 고정 */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t("ships.createReservation")}
          </h2>
          <ReservationForm
            cabinId={cabin.id}
            onSuccess={handleReservationSuccess}
            existingReservations={reservations}
            isModal={false}
          />
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* 예약 목록 */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {t("ships.reservations")}
          </h2>

          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t("ships.noReservations")}
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <ReservationItem
                  key={reservation.id}
                  reservation={reservation}
                  currentUserId={profile?.id}
                  userRole={userRole || undefined}
                  onUpdate={fetchCabinDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
