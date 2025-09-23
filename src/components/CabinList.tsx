"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { ShipCabin } from "@/types/database";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface CabinListProps {
  shipId: string;
  shipPublicId: string;
}

export function CabinList({ shipId, shipPublicId }: CabinListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [cabins, setCabins] = useState<ShipCabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCabins();
  }, [shipId]);

  const fetchCabins = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("ship_cabins")
        .select("*")
        .eq("ship_id", shipId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setCabins(data || []);
    } catch (err: any) {
      console.error("Failed to fetch cabins:", err);
      setError(err.message || t("ships.errorLoadingCabins"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          {t("ships.cabins")}
        </h2>
      </div>

      {cabins.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t("ships.noCabins")}
          </h3>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cabins.map((cabin) => (
            <div
              key={cabin.id}
              className="bg-muted rounded-lg p-6 border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {cabin.name}
                </h3>
                <div className="text-2xl">🏠</div>
              </div>

              {cabin.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {cabin.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span>{new Date(cabin.created_at).toLocaleDateString()}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    router.push(`/ship/${shipPublicId}/cabin/${cabin.id}`)
                  }
                >
                  {t("ships.reserveCabin")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
