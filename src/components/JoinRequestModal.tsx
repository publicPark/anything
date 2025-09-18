"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isSubmitting: boolean;
}

export function JoinRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: JoinRequestModalProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(message);
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t("ships.requestToJoin")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("ships.requestMessage")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder={t("ships.requestMessagePlaceholder")}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={handleClose}
              variant="secondary"
              disabled={isSubmitting}
            >
              {t("ships.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                t("ships.requestToJoin")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
