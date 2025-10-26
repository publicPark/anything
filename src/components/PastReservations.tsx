"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ReservationItem } from "@/components/ReservationItem";
import { CabinReservation } from "@/types/database";
import { useI18n } from "@/hooks/useI18n";

interface PastReservationsProps {
  cabinId: string;
  currentUserId?: string;
  userRole?: "captain" | "mechanic" | "crew";
  existingReservations: CabinReservation[];
  onUpdate: () => void;
}

export function PastReservations({
  cabinId,
  currentUserId,
  userRole,
  existingReservations,
  onUpdate,
}: PastReservationsProps) {
  const { t } = useI18n();
  const supabase = createClient();

  const [pastItems, setPastItems] = useState<CabinReservation[]>([]);
  const [pastPage, setPastPage] = useState(0);
  const PAST_PAGE_SIZE = 4; // 원래 의도대로 4개 유지
  const [loadingPast, setLoadingPast] = useState(false);
  const [pastHasMore, setPastHasMore] = useState(true);

  // Reset pagination when cabin changes
  useEffect(() => {
    setPastItems([]);
    setPastPage(0);
    setPastHasMore(true);
  }, [cabinId]);

  const fetchPastPage = useCallback(async () => {
    if (loadingPast) return;
    setLoadingPast(true);
    try {
      const nowIso = new Date().toISOString();
      const from = pastPage * PAST_PAGE_SIZE;
      const to = from + PAST_PAGE_SIZE - 1;
      
      // 더 효율적인 쿼리: 인덱스 활용
      const { data, error, count } = await supabase
        .from("cabin_reservations")
        .select("*", { count: "exact" })
        .eq("cabin_id", cabinId)
        .eq("status", "confirmed")
        .lt("end_time", nowIso)
        .order("start_time", { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      const list = (data ?? []) as CabinReservation[];
      setPastItems((prev) => (pastPage === 0 ? list : [...prev, ...list]));
      
      // 더 정확한 hasMore 계산
      if (typeof count === "number") {
        const fetched = (pastPage + 1) * PAST_PAGE_SIZE;
        setPastHasMore(fetched < count);
      } else {
        // 페이지 크기보다 적게 가져왔다면 더 이상 데이터가 없음
        setPastHasMore(list.length === PAST_PAGE_SIZE);
      }
      
      // 데이터가 없으면 hasMore를 false로 설정
      if (list.length === 0) {
        setPastHasMore(false);
      }
      setPastPage((p) => p + 1);
      setLoadingPast(false);
    } catch (e: unknown) {
      // Gracefully handle 416 Range Not Satisfiable
      const message: string = e instanceof Error ? e.message : "";
      const status: number | undefined =
        e &&
        typeof e === "object" &&
        "status" in e &&
        typeof e.status === "number"
          ? e.status
          : undefined;
      if (status === 416 || message.includes("Range Not Satisfiable")) {
        setPastHasMore(false);
        setLoadingPast(false);
        return;
      }
      console.error("Failed to fetch past reservations:", e);
      setLoadingPast(false);
    }
  }, [pastPage, cabinId, supabase]);

  const handleDeleteAll = async () => {
    if (!confirm(t("ships.confirmDeleteAllPastReservations"))) {
      return;
    }
    try {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("cabin_reservations")
        .select("id")
        .eq("cabin_id", cabinId)
        .eq("status", "confirmed")
        .lt("end_time", nowIso);
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      if (ids.length === 0) return;
      const { error: delError } = await supabase
        .from("cabin_reservations")
        .delete()
        .in("id", ids);
      if (delError) throw delError;
      onUpdate();
      setPastItems([]);
      setPastPage(0);
      setPastHasMore(false);
      alert(t("ships.pastReservationsDeleted"));
    } catch (e: unknown) {
      console.error(e);
      alert(t("ships.errorDeletingReservations"));
    }
  };

  const handleReservationUpdate = () => {
    onUpdate();
    setPastItems([]);
    setPastPage(0);
    setPastHasMore(true);
  };

  // Load first page when component mounts
  useEffect(() => {
    const loadFirstPage = async () => {
      setLoadingPast(true);
      try {
        const nowIso = new Date().toISOString();
        const { data, error, count } = await supabase
          .from("cabin_reservations")
          .select("*", { count: "exact" })
          .eq("cabin_id", cabinId)
          .eq("status", "confirmed")
          .lt("end_time", nowIso)
          .order("start_time", { ascending: false })
          .range(0, PAST_PAGE_SIZE - 1);
          
        if (error) throw error;
        const list = (data ?? []) as CabinReservation[];
        setPastItems(list);
        
        // 더 정확한 hasMore 계산
        if (typeof count === "number") {
          setPastHasMore(count > PAST_PAGE_SIZE);
        } else {
          setPastHasMore(list.length === PAST_PAGE_SIZE);
        }
        
        // 데이터가 없으면 hasMore를 false로 설정
        if (list.length === 0) {
          setPastHasMore(false);
        }
        setPastPage(1);
        setLoadingPast(false);
      } catch (e: unknown) {
        console.error("Failed to fetch past reservations:", e);
        setLoadingPast(false);
      }
    };
    
    if (pastItems.length === 0) {
      void loadFirstPage();
    }
  }, [cabinId, pastItems.length, supabase]);

  return (
    <div>
      {(userRole === "captain" || userRole === "mechanic") && (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDeleteAll}
          >
            {t("ships.deleteAllPastReservations")}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <div className="text-xs text-muted-foreground bg-muted/50 border border-border rounded-md p-3">
          {t("ships.pastReservationsInfo")}
        </div>
        {pastItems.length > 0 ? (
          pastItems.map((reservation) => (
            <ReservationItem
              key={reservation.id}
              reservation={reservation}
              currentUserId={currentUserId}
              userRole={userRole}
              onUpdate={handleReservationUpdate}
              cabinId={cabinId}
              existingReservations={existingReservations}
            />
          ))
        ) : !loadingPast ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm text-muted-foreground">
              {t("ships.noPastReservations")}
            </p>
          </div>
        ) : null}

        {pastHasMore && (
          <div className="pt-2">
            <button
              type="button"
              onClick={fetchPastPage}
              disabled={loadingPast}
              className="w-full text-sm px-3 py-2 rounded-md border border-border bg-muted hover:bg-muted/80 disabled:opacity-60"
            >
              {loadingPast ? t("common.loading") : t("common.loadMore")}
            </button>
          </div>
        )}

        {loadingPast && (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
}
