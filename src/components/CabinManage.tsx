"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { ShipCabin, ShipMemberRole } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import EditCabinModal from "@/components/EditCabinModal";

interface CabinFormData {
  name: string;
  description: string;
}

interface CabinManageProps {
  shipId: string;
  userRole?: ShipMemberRole;
  onCabinCreated?: (cabin: ShipCabin) => void;
  onCabinUpdated?: (cabin: ShipCabin) => void;
  onCabinDeleted?: (cabinId: string) => void;
}

export function CabinManage({
  shipId,
  userRole,
  onCabinCreated,
  onCabinUpdated,
  onCabinDeleted,
}: CabinManageProps) {
  const { t } = useI18n();
  const [cabins, setCabins] = useState<ShipCabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCabin, setEditingCabin] = useState<ShipCabin | null>(null);
  const [formData, setFormData] = useState<CabinFormData>({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const canManageCabins = userRole === "captain" || userRole === "mechanic";

  // 에러 처리 함수
  const handleError = (err: unknown, defaultMessage: string) => {
    console.error(defaultMessage, err);

    let message = defaultMessage;

    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === "object") {
      // Supabase 에러 객체 처리
      const errorObj = err as {
        message?: string;
        error?: { message?: string };
        details?: string;
        hint?: string;
      };
      if (errorObj.message) {
        message = errorObj.message;
      } else if (errorObj.error?.message) {
        message = errorObj.error.message;
      } else if (errorObj.details) {
        message = errorObj.details;
      } else if (errorObj.hint) {
        message = errorObj.hint;
      }
    } else if (typeof err === "string") {
      message = err;
    }

    setError(message);
  };

  useEffect(() => {
    if (canManageCabins) {
      fetchCabins();
    }
  }, [shipId, canManageCabins]);

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
    } catch (err: unknown) {
      handleError(err, t("ships.errorLoadingCabins"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCabin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError(t("ships.cabinNameRequired"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_ship_cabin", {
        ship_uuid: shipId,
        cabin_name: formData.name.trim(),
        cabin_description: formData.description.trim() || null,
      });

      if (error) {
        throw error;
      }

      setCabins((prev) => [data, ...prev]);
      setFormData({ name: "", description: "" });
      setShowCreateForm(false);
      onCabinCreated?.(data);
    } catch (err: unknown) {
      handleError(err, t("ships.errorCreatingCabin"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStart = (cabin: ShipCabin) => {
    setEditingCabin(cabin);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedCabin: ShipCabin) => {
    setCabins((prev) =>
      prev.map((cabin) => (cabin.id === updatedCabin.id ? updatedCabin : cabin))
    );
    setEditingCabin(null);
    setShowEditModal(false);
    onCabinUpdated?.(updatedCabin);
  };

  const handleEditCancel = () => {
    setEditingCabin(null);
    setShowEditModal(false);
  };

  const handleDeleteCabin = async (cabinId: string) => {
    if (!confirm(t("ships.confirmDeleteCabin"))) {
      return;
    }

    try {
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.rpc("delete_ship_cabin", {
        cabin_uuid: cabinId,
      });

      if (error) {
        throw error;
      }

      setCabins((prev) => prev.filter((cabin) => cabin.id !== cabinId));
      onCabinDeleted?.(cabinId);
    } catch (err: unknown) {
      handleError(err, t("ships.errorDeletingCabin"));
    }
  };


  const handleCreateCancel = () => {
    setShowCreateForm(false);
    setFormData({ name: "", description: "" });
  };

  if (!canManageCabins) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {t("ships.insufficientPermissionsCabin")}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">
          {t("ships.manageCabins")}
        </h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="primary"
          disabled={editingCabin !== null}
        >
          {t("ships.createCabin")}
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-muted rounded-lg p-6">
          <h4 className="text-lg font-medium text-foreground mb-4">
            {t("ships.createCabin")}
          </h4>
          <form onSubmit={handleCreateCabin} className="space-y-4">
            <div>
              <label
                htmlFor="cabinName"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t("ships.cabinName")}
              </label>
              <input
                type="text"
                id="cabinName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("ships.cabinNamePlaceholder")}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="cabinDescription"
                className="block text-sm font-medium text-foreground mb-2"
              >
                {t("ships.cabinDescription")}
              </label>
              <textarea
                id="cabinDescription"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t("ships.cabinDescriptionPlaceholder")}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} variant="primary">
                {submitting ? t("common.loading") : t("ships.save")}
              </Button>
              <Button
                type="button"
                onClick={handleCreateCancel}
                variant="secondary"
              >
                {t("ships.cancel")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Cabin List */}
      <div className="space-y-4">
        {cabins.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t("ships.noCabins")}</p>
            <Button onClick={() => setShowCreateForm(true)} variant="primary">
              {t("ships.createFirstCabin")}
            </Button>
          </div>
        ) : (
          cabins.map((cabin) => (
            <div
              key={cabin.id}
              className="bg-muted rounded-lg p-4 border border-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-foreground mb-2">
                    {cabin.name}
                  </h4>
                  {cabin.description && (
                    <p className="text-muted-foreground text-sm mb-2 whitespace-pre-line">
                      {cabin.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(cabin.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleEditStart(cabin)}
                    variant="secondary"
                    size="sm"
                    disabled={showCreateForm}
                  >
                    {t("ships.editCabin")}
                  </Button>
                  <Button
                    onClick={() => handleDeleteCabin(cabin.id)}
                    variant="destructive"
                    size="sm"
                    disabled={showCreateForm}
                  >
                    {t("ships.deleteCabin")}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 선실 수정 모달 */}
      <EditCabinModal
        isOpen={showEditModal}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccess}
        cabin={editingCabin}
      />
    </div>
  );
}
