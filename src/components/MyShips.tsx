"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShipForm } from "@/components/ShipForm";
import { ShipCard } from "@/components/ShipCard";
import { Ship, ShipMember, Profile, ShipMemberRole } from "@/types/database";

interface ShipWithDetails extends Ship {
  members: (ShipMember & { profile: Profile })[];
  userRole?: ShipMemberRole;
}

export function MyShips() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();

  const [ships, setShips] = useState<ShipWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const canCreateShip = profile?.role === "gaia" || profile?.role === "chaos";

  useEffect(() => {
    if (profile) {
      fetchUserShips();
    }
  }, [profile]);

  const fetchUserShips = async () => {
    if (!profile) return;

    setIsLoading(true);
    setError(null);

    try {
      // 사용자가 멤버인 배들을 조회
      const { data: memberships, error: membershipError } = await supabase
        .from("ship_members")
        .select(
          `
          *,
          ship:ships(*)
        `
        )
        .eq("user_id", profile.id);

      if (membershipError) {
        throw membershipError;
      }

      if (memberships) {
        // 각 배의 멤버 정보도 함께 조회
        const shipsWithDetails = await Promise.all(
          memberships.map(async (membership) => {
            const { data: shipMembers, error: membersError } = await supabase
              .from("ship_members")
              .select(
                `
                *,
                profile:profiles(*)
              `
              )
              .eq("ship_id", membership.ship.id);

            if (membersError) {
              console.error(
                "Failed to fetch ship members:",
                membersError.message
              );
            }

            return {
              ...membership.ship,
              members: shipMembers || [],
              userRole: membership.role,
            };
          })
        );

        setShips(shipsWithDetails);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "배 목록을 불러오는 중 오류가 발생했습니다.";
      console.error("Failed to fetch user ships:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipClick = (ship: ShipWithDetails) => {
    router.push(`/${locale}/ship/${ship.public_id}`);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchUserShips(); // 목록 새로고침
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <h2 className="text-2xl font-bold text-foreground">
          {t("ships.myShips")}
        </h2>
      </div>
      
      {canCreateShip && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="secondary"
            size="sm"
          >
            {t("ships.createShip")}
          </Button>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-muted rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <ShipForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {ships.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <div className="text-6xl">⛵️</div>
          </div>
          <p className="text-muted-foreground mb-4">{t("ships.noShips")}</p>
          {canCreateShip && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              {t("ships.createShip")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {ships.map((ship) => (
            <ShipCard
              key={ship.id}
              ship={ship}
              onClick={() => handleShipClick(ship)}
              showUserRole={true}
              showMemberCount={true}
              showCreatedAt={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
