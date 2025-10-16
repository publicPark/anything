"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";

export default function ReservationsPage() {
  const { locale } = useI18n();
  const { profile, loading: profileLoading } = useProfile();
  const { getLocalizedPath } = useNavigation();
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // chaos 권한 체크
  useEffect(() => {
    if (!profileLoading && profile?.role !== "chaos") {
      router.push(`/${locale}`);
    }
  }, [profileLoading, profile, router, locale]);

  const handleDeleteAllPastReservations = async () => {
    if (
      !confirm("Delete all past reservations? This action cannot be undone.")
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 현재 시간 이전의 모든 예약 조회
      const now = new Date().toISOString();
      const { data: pastReservations, error: fetchError } = await supabase
        .from("cabin_reservations")
        .select("id")
        .eq("status", "confirmed")
        .lt("end_time", now);

      if (fetchError) {
        throw fetchError;
      }

      if (!pastReservations || pastReservations.length === 0) {
        setSuccess("No past reservations to delete.");
        return;
      }

      // 모든 과거 예약 삭제
      const { error: deleteError } = await supabase
        .from("cabin_reservations")
        .delete()
        .in(
          "id",
          pastReservations.map((r) => r.id)
        );

      if (deleteError) {
        throw deleteError;
      }

      setSuccess(
        `${pastReservations.length} past reservations have been deleted.`
      );
    } catch (err: unknown) {
      console.error("Failed to delete past reservations:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error occurred while deleting past reservations."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (profile?.role !== "chaos") {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <ErrorMessage
          message={"You do not have permission to access this page."}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: "Admin", href: getLocalizedPath("/admin") },
          { label: "Reservation Management", isCurrentPage: true },
        ]}
      />

      {/* 관리 기능 */}
      <div className="space-y-6">
        <div className="bg-muted rounded-lg p-6">
          <Button
            variant="secondary"
            size="md"
            onClick={handleDeleteAllPastReservations}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              "Delete All Past Reservations"
            )}
          </Button>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-6">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="mt-6">
              <ErrorMessage message={success} variant="success" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
