"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { ShipCabin } from "@/types/database";

interface EditCabinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCabin: ShipCabin) => void;
  cabin: ShipCabin | null;
}

export default function EditCabinModal({
  isOpen,
  onClose,
  onSuccess,
  cabin,
}: EditCabinModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useI18n();
  const supabase = createClient();

  // 모달이 열릴 때 선실 데이터로 폼 초기화
  useEffect(() => {
    if (isOpen && cabin) {
      setFormData({
        name: cabin.name,
        description: cabin.description || "",
      });
      setError(null);
    }
  }, [isOpen, cabin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cabin || !formData.name.trim()) {
      setError(t("ships.cabinNameRequired"));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("update_ship_cabin", {
        cabin_uuid: cabin.id,
        cabin_name: formData.name.trim(),
        cabin_description: formData.description.trim() || null,
      });

      if (error) {
        throw error;
      }

      onSuccess(data);
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("ships.errorUpdatingCabin");
      console.error("Failed to update cabin:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!isOpen || !cabin) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            {t("ships.editCabin")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {cabin.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cabinName" className="block text-sm font-medium text-foreground mb-2">
              {t("ships.cabinName")}
            </label>
            <input
              id="cabinName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-input focus:outline-none focus:ring-ring focus:border-ring"
              placeholder={t("ships.cabinNamePlaceholder")}
              disabled={isSaving}
              required
            />
          </div>

          <div>
            <label htmlFor="cabinDescription" className="block text-sm font-medium text-foreground mb-2">
              {t("ships.cabinDescription")}
            </label>
            <textarea
              id="cabinDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-input focus:outline-none focus:ring-ring focus:border-ring resize-none"
              placeholder={t("ships.cabinDescriptionPlaceholder")}
              disabled={isSaving}
              rows={3}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1"
            >
              {t("ships.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !formData.name.trim()}
              isLoading={isSaving}
              className="flex-1"
            >
              {isSaving 
                ? t("common.loading")
                : t("ships.save")
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
