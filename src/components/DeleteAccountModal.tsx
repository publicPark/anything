"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { LOCALIZED_MESSAGES } from "@/lib/locale-helpers";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { locale } = useI18n();
  const supabase = createClient();

  const requiredText = LOCALIZED_MESSAGES.ui.delete(locale).toUpperCase();

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(LOCALIZED_MESSAGES.validation.userNotFound(locale));
      }

      // 배 생성자 체크 - created_by에 있는 배가 있으면 탈퇴 불가
      const { data: ownedShips, error: shipsError } = await supabase
        .from("ships")
        .select("id, name")
        .eq("created_by", user.id);

      if (shipsError) {
        throw new Error(
          locale === "en"
            ? "Failed to check owned ships"
            : "소유한 배를 확인할 수 없습니다"
        );
      }

      if (ownedShips && ownedShips.length > 0) {
        const shipNames = ownedShips.map(ship => ship.name).join(", ");
        throw new Error(
          locale === "en"
            ? `Cannot delete account. You are the creator of the following ships: ${shipNames}. Please transfer captaincy to another member first.`
            : `계정을 삭제할 수 없습니다. 다음 배의 생성자입니다: ${shipNames}. 먼저 다른 멤버에게 선장을 양도해주세요.`
        );
      }

      // 1. Delete user profile first
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) {
        console.error("Failed to delete profile:", profileError.message);
        // Continue with account deletion even if profile deletion fails
      }

      // 2. Try to delete user account using RPC function
      const { error: userDeleteError } = await supabase.rpc("delete_user");

      if (userDeleteError) {
        // If RPC fails, try direct deletion (this might not work due to RLS)
        const { error: directDeleteError } = await supabase
          .from("auth.users")
          .delete()
          .eq("id", user.id);

        if (directDeleteError) {
          throw new Error(
            locale === "en"
              ? "Unable to delete account. Please contact support."
              : "계정을 삭제할 수 없습니다. 고객지원에 문의해주세요."
          );
        }
      }

      // 3. Sign out and redirect
      await supabase.auth.signOut();
      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : locale === "en"
          ? "Failed to delete account. Please try again."
          : "계정 삭제에 실패했습니다. 다시 시도해주세요.";
      console.error("Failed to delete account:", errorMessage);
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
            {LOCALIZED_MESSAGES.ui.deleteAccount(locale)}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            {locale === "en"
              ? "This action cannot be undone. All your data will be permanently deleted."
              : "이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다."}
          </p>

          <div className="text-left mb-4">
            <p className="text-xs text-muted-foreground mb-2">
              {locale === "en"
                ? "To confirm, type:"
                : "확인을 위해 입력하세요:"}
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
              {LOCALIZED_MESSAGES.ui.cancel(locale)}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== requiredText}
              isLoading={isDeleting}
              className="flex-1"
            >
              {LOCALIZED_MESSAGES.ui.deleteAccount(locale)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
