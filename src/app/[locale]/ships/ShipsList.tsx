"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { useShipStore, useShipActions } from "@/stores/shipStore";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShipForm } from "@/components/ShipForm";
import { ShipCard } from "@/components/ShipCard";

export default function ShipsList() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();

  // Zustand store에서 상태와 액션 가져오기
  const { ships, loading: isLoading, error } = useShipStore();
  const { fetchAllShips } = useShipActions();

  const [showCreateForm, setShowCreateForm] = useState(false);

  const canCreateShip = profile?.role === "gaia" || profile?.role === "chaos";

  useEffect(() => {
    if (profile) {
      fetchAllShips();
    }
  }, [profile, fetchAllShips]);

  const handleShipClick = (ship: any) => {
    router.push(`/${locale}/ship/${ship.public_id}`);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchAllShips(); // 목록 새로고침
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          {t("ships.title")}
        </h1>

        {canCreateShip && (
          <Button onClick={() => setShowCreateForm(true)} variant="primary">
            {t("ships.createShip")}
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 mb-0">
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
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t("ships.noShips")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {canCreateShip
              ? t("ships.createFirstShip")
              : t("ships.insufficientPermissions")}
          </p>
          {canCreateShip && (
            <Button onClick={() => setShowCreateForm(true)} variant="primary">
              {t("ships.createShip")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ships.map((ship) => (
            <ShipCard
              key={ship.id}
              ship={ship}
              onClick={() => handleShipClick(ship)}
              showUserRole={false}
              showMemberCount={false}
              showCreatedAt={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
