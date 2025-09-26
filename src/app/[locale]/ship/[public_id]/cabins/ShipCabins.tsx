"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CabinList } from "@/components/CabinList";
import { Ship } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { RoleBadge } from "@/components/ui/RoleBadge";

export default function ShipCabinsForm() {
  const { t, locale } = useI18n();
  const params = useParams();
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  const [ship, setShip] = useState<Ship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"captain" | "mechanic" | "crew" | null>(null);

  const shipPublicId = params.public_id as string;

  useEffect(() => {
    if (!profileLoading && shipPublicId) {
      fetchShipDetails();
    }
  }, [profileLoading, shipPublicId]);

  const fetchShipDetails = async () => {
    if (!shipPublicId) return;

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
    } catch (err: unknown) {
      console.error("Failed to fetch ship details:", err);
      setError(err instanceof Error ? err.message : t("ships.errorLoadingShip"));
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* 선실 목록 */}
      <CabinList shipId={ship.id} shipPublicId={shipPublicId} />
    </div>
  );
}
