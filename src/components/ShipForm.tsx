"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useShipActions } from "@/stores/shipStore";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ShipFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ShipFormData {
  name: string;
  description: string;
  memberOnly: boolean;
  memberApprovalRequired: boolean;
}

export function ShipForm({ onSuccess, onCancel }: ShipFormProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { createShip } = useShipActions();

  const [formData, setFormData] = useState<ShipFormData>({
    name: "",
    description: "",
    memberOnly: false,
    memberApprovalRequired: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError(t("ships.shipNameRequired"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ship = await createShip({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        member_only: formData.memberOnly,
        member_approval_required: formData.memberApprovalRequired,
      });

      if (ship) {
        // 성공 시 배 상세 페이지로 이동
        router.push(`/${locale}/ship/${ship.public_id}`);
        onSuccess?.();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t("ships.errorCreatingShip");
      console.error("Failed to create ship:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {t("ships.createShip")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {t("ships.shipName")}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t("ships.shipNamePlaceholder")}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-input text-foreground"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {t("ships.shipDescription")}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder={t("ships.shipDescriptionPlaceholder")}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-input text-foreground"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="memberOnly"
              name="memberOnly"
              checked={formData.memberOnly}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-ring border-border rounded"
            />
            <label
              htmlFor="memberOnly"
              className="ml-2 block text-sm text-foreground"
            >
              {t("ships.memberOnlyQuestion")}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="memberApprovalRequired"
              name="memberApprovalRequired"
              checked={formData.memberApprovalRequired}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-ring border-border rounded"
            />
            <label
              htmlFor="memberApprovalRequired"
              className="ml-2 block text-sm text-foreground"
            >
              {t("ships.memberApprovalRequiredQuestion")}
            </label>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : t("ships.create")}
          </Button>

          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              className="flex-1"
            >
              {t("ships.cancel")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
