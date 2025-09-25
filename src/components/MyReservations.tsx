"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ReservationItem } from "@/components/ReservationItem";
import { ShipTabs } from "@/components/ShipTabs";
import { CabinReservation, Ship, ShipCabin } from "@/types/database";
import Link from "next/link";

interface MyReservationsProps {
  limit?: number;
}

export function MyReservations({ limit = 10 }: MyReservationsProps) {
  const { t, locale } = useI18n();
  const { profile } = useProfile();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  type JoinedReservation = {
    reservation: CabinReservation;
    cabin?: Pick<ShipCabin, "id" | "name" | "public_id" | "ship_id">;
    ship?: Pick<Ship, "id" | "name" | "public_id">;
  };

  const [upcoming, setUpcoming] = useState<JoinedReservation[]>([]);
  const [past, setPast] = useState<JoinedReservation[]>([]);
  const [loadingPast, setLoadingPast] = useState<boolean>(false);
  const [pastPage, setPastPage] = useState<number>(0);
  const PAST_PAGE_SIZE = 4;
  const [pastHasMore, setPastHasMore] = useState<boolean>(true);
  const [pastTotalCount, setPastTotalCount] = useState<number | null>(null);
  // Simple in-memory caches to avoid duplicate cabin/ship fetches across tabs
  const [cabinCache, setCabinCache] = useState<Map<string, Pick<ShipCabin, "id" | "name" | "public_id" | "ship_id">>>(new Map());
  const [shipCache, setShipCache] = useState<Map<string, Pick<Ship, "id" | "name" | "public_id">>>(new Map());

  const currentUserId = profile?.id;

  const clearCaches = () => {
    setCabinCache(new Map());
    setShipCache(new Map());
  };

  const fetchUpcoming = async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const nowIso = new Date().toISOString();
      // Include ongoing as upcoming by filtering end_time >= now
      const { data, error } = await supabase
        .from("cabin_reservations")
        .select("*")
        .eq("status", "confirmed")
        .eq("user_id", currentUserId)
        .gte("end_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(limit);
      if (error) throw error;
      const reservations = (data ?? []) as CabinReservation[];
      const enriched = await enrichWithCabinAndShip(reservations);
      setUpcoming(enriched);
    } catch (err: any) {
      console.error("Failed to fetch upcoming reservations:", err);
      setError(err.message || t("ships.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPast = async (resetPagination = false) => {
    if (!currentUserId || loadingPast) return;
    
    // Reset pagination state if requested
    if (resetPagination) {
      setPastPage(0);
      setPastHasMore(true);
      setPastTotalCount(null);
      setPast([]);
      clearCaches();
    }
    
    setLoadingPast(true);
    setError(null);
    try {
      const supabase = createClient();
      const nowIso = new Date().toISOString();
      const currentPage = resetPagination ? 0 : pastPage;
      const from = currentPage * PAST_PAGE_SIZE;
      const to = from + PAST_PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("cabin_reservations")
        .select("*", { count: "exact" })
        .eq("status", "confirmed")
        .eq("user_id", currentUserId)
        .lt("end_time", nowIso)
        .order("start_time", { ascending: false })
        .range(from, to);
      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      const reservations = (data ?? []) as CabinReservation[];
      const enriched = await enrichWithCabinAndShip(reservations);
      setPast((prev) => (resetPagination || currentPage === 0 ? enriched : [...prev, ...enriched]));
      
      // Determine if there are more
      if (typeof count === "number") {
        setPastTotalCount(count);
        const fetched = (currentPage + 1) * PAST_PAGE_SIZE;
        setPastHasMore(fetched < count);
      } else {
        // If no count available, check if we got fewer items than requested
        // If we got 0 items, there are definitely no more
        setPastHasMore(enriched.length > 0 && enriched.length === PAST_PAGE_SIZE);
      }
      setPastPage((p) => resetPagination ? 1 : p + 1);
      
      // Ensure loading is stopped
      setLoadingPast(false);
    } catch (err: any) {
      // Gracefully handle 416 Range Not Satisfiable and empty results
      const message: string = typeof err?.message === "string" ? err.message : "";
      const status: number | undefined = typeof err?.status === "number" ? err.status : undefined;
      if (status === 416 || message.includes("Range Not Satisfiable")) {
        setPastHasMore(false);
        setLoadingPast(false);
        return;
      }
      console.error("Failed to fetch past reservations:", err);
      setError(message || t("ships.errorGeneric"));
      setLoadingPast(false);
    }
  };

  const enrichWithCabinAndShip = async (
    reservations: CabinReservation[]
  ): Promise<JoinedReservation[]> => {
    if (reservations.length === 0) return [];

    const supabase = createClient();
    const requestedCabinIds = Array.from(new Set(reservations.map((r) => r.cabin_id)));
    const missingCabinIds = requestedCabinIds.filter((id) => !cabinCache.has(id));

    let cabinsData: any[] = [];
    if (missingCabinIds.length > 0) {
      const { data, error } = await supabase
        .from("ship_cabins")
        .select("id,name,public_id,ship_id")
        .in("id", missingCabinIds);
      if (error) {
        console.error("Error fetching cabins:", error);
        throw error;
      }
      cabinsData = data ?? [];
      // populate cache
      setCabinCache((prev) => {
        const next = new Map(prev);
        cabinsData.forEach((c: any) => {
          next.set(c.id, {
            id: c.id,
            name: c.name,
            public_id: c.public_id,
            ship_id: c.ship_id,
          });
        });
        return next;
      });
    }

    const allCabins: Array<Pick<ShipCabin, "id" | "name" | "public_id" | "ship_id">> = requestedCabinIds
      .map((id) => cabinCache.get(id) || cabinsData.find((c: any) => c.id === id))
      .filter(Boolean) as any[];

    const requestedShipIds = Array.from(new Set(allCabins.map((c) => c.ship_id)));
    const missingShipIds = requestedShipIds.filter((id) => !shipCache.has(id));

    let shipsData: any[] = [];
    if (missingShipIds.length > 0) {
      const { data, error } = await supabase
        .from("ships")
        .select("id,name,public_id")
        .in("id", missingShipIds);
      if (error) {
        console.error("Error fetching ships:", error);
        throw error;
      }
      shipsData = data ?? [];
      // populate cache
      setShipCache((prev) => {
        const next = new Map(prev);
        shipsData.forEach((s: any) => {
          next.set(s.id, { id: s.id, name: s.name, public_id: s.public_id });
        });
        return next;
      });
    }

    return reservations.map((r) => {
      const cabin = (cabinCache.get(r.cabin_id) || allCabins.find((c) => c.id === r.cabin_id)) as
        | Pick<ShipCabin, "id" | "name" | "public_id" | "ship_id">
        | undefined;
      const ship = cabin
        ? ((shipCache.get(cabin.ship_id) || shipsData.find((s) => s.id === cabin.ship_id)) as
            | Pick<Ship, "id" | "name" | "public_id">
            | undefined)
        : undefined;
      return {
        reservation: r,
        cabin,
        ship,
      };
    });
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUpcoming();
    } else {
      setUpcoming([]);
      setPast([]);
      setLoading(false);
      setLoadingPast(false);
      clearCaches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleTabChange = (tabId: string) => {
    const tab = tabId as "upcoming" | "past";
    setActiveTab(tab);
    if (tab === "past" && past.length === 0 && !loadingPast) {
      void fetchPast(true);
    }
  };

  const hasUpcoming = useMemo(() => upcoming.length > 0, [upcoming]);
  const hasPast = useMemo(() => past.length > 0, [past]);

  if (!currentUserId) return null;

  // 탭 데이터 준비
  const tabs = [
    {
      id: "upcoming",
      label: t("home.activeReservations"),
      content: (
        <div className="space-y-6">
          {hasUpcoming ? (
            upcoming.map(({ reservation, cabin, ship }) => {
              const now = new Date();
              const start = new Date(reservation.start_time);
              const end = new Date(reservation.end_time);
              const isCurrent = now >= start && now < end;
              return (
                <ReservationItem
                  key={reservation.id}
                  reservation={reservation}
                  currentUserId={currentUserId}
                  onUpdate={() => {
                    fetchUpcoming();
                    // Reset past reservations if we're on past tab
                    if (activeTab === "past") {
                      void fetchPast(true);
                    }
                  }}
                  isCurrent={isCurrent}
                  hideTypeBadge
                  cabinId={cabin?.id}
                  existingReservations={upcoming.map(item => item.reservation)}
                  leftExtra={
                    ship && cabin ? (
                      <Link
                        href={`/${locale}/ship/${ship.public_id}/cabin/${cabin.public_id}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {ship.name} · {cabin.name}
                      </Link>
                    ) : null
                  }
                />
              );
            })
          ) : !loading ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🗓️</div>
              <p className="text-sm text-muted-foreground">{t("ships.noUpcomingReservations")}</p>
            </div>
          ) : null}

          {loading && (
            <div className="flex justify-center items-center py-4">
              <LoadingSpinner />
            </div>
          )}
        </div>
      ),
    },
    {
      id: "past",
      label: t("ships.pastReservations"),
      content: (
        <div className="space-y-6">
          <div className="text-xs text-muted-foreground bg-muted/50 border border-border rounded-md p-3">
            {t("ships.pastReservationsInfo")}
          </div>
          {hasPast ? (
            past.map(({ reservation, cabin, ship }) => (
              <ReservationItem
                key={reservation.id}
                reservation={reservation}
                currentUserId={currentUserId}
                onUpdate={() => {
                  fetchUpcoming();
                  // Reset past reservations pagination
                  void fetchPast(true);
                }}
                hideTypeBadge
                cabinId={cabin?.id}
                existingReservations={past.map(item => item.reservation)}
                leftExtra={
                  ship && cabin ? (
                    <Link
                      href={`/${locale}/ship/${ship.public_id}/cabin/${cabin.public_id}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {ship.name} · {cabin.name}
                    </Link>
                  ) : null
                }
              />
            ))
          ) : !loadingPast ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🗓️</div>
              <p className="text-sm text-muted-foreground">{t("ships.noPastReservations")}</p>
            </div>
          ) : null}

          {pastHasMore && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => fetchPast(false)}
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
      ),
    },
  ];

  return (
    <section aria-labelledby="my-reservations-heading" className="text-left">
      <div className="mb-4">
        <h2 id="my-reservations-heading" className="text-2xl font-semibold text-foreground mb-3 text-center">
            {t("home.myReservations")}
        </h2>
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : (
        <ShipTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}
    </section>
  );
}


