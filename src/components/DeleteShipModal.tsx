"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface DeleteShipModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipId: string;
  shipName?: string;
}

export default function DeleteShipModal({
  isOpen,
  onClose,
  shipId,
  shipName,
}: DeleteShipModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useI18n();
  const supabase = createClient();
  const router = useRouter();

  const requiredText = locale === "en" ? "DELETE" : "삭제";

  const handleDelete = async () => {
    if (confirmText !== requiredText) {
      setError(
        locale === "en"
          ? `Please type "${requiredText}" to confirm`
          : `확인을 위해 "${requiredText}"를 입력해주세요`
      );
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const { error } = await supabase.from("ships").delete().eq("id", shipId);

      if (error) {
        throw error;
      }

      // 성공 시 홈으로 이동
      router.push(`/${locale}`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : locale === "en"
          ? "Failed to delete team. Please try again."
          : "팀 삭제에 실패했습니다. 다시 시도해주세요.";
      console.error("Failed to delete ship:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto h-12 w-12 text-destructive mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("ships.deleteShipModal.title")}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            {t("ships.deleteShipModal.description")}
          </p>

          {shipName && (
            <div className="bg-muted/50 border border-border rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-foreground">
                {locale === "en" ? "Team:" : "팀:"} {shipName}
              </p>
            </div>
          )}

          <div className="text-left mb-4">
            <p className="text-xs text-muted-foreground mb-2">
              {t("ships.deleteShipModal.confirmText")}
            </p>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {requiredText}
            </code>
          </div>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={requiredText}
            className="w-full px-3 py-2 border border-border rounded-md text-foreground bg-input focus:outline-none focus:ring-ring focus:border-ring"
            disabled={isDeleting}
          />

          {error && (
            <div className="mt-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1"
            >
              {t("ships.deleteShipModal.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== requiredText}
              isLoading={isDeleting}
              className="flex-1"
            >
              {isDeleting 
                ? t("ships.deleteShipModal.deleting")
                : t("ships.deleteShipModal.delete")
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
