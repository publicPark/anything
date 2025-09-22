"use client";

import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { JoinRequestModal } from "@/components/JoinRequestModal";
import { Ship, ShipMember, Profile } from "@/types/database";

type ShipMemberRole = "captain" | "mechanic" | "crew";

interface ShipWithDetails extends Ship {
  members: (ShipMember & { profile: Profile })[];
  userRole?: ShipMemberRole;
  isMember: boolean;
  hasPendingRequest?: boolean;
  hasRejectedRequest?: boolean;
}

interface ShipHeaderProps {
  ship: ShipWithDetails;
  profile: Profile | null;
  locale: string;
  onJoinShip: (message?: string) => void;
  onLeaveShip: () => void;
  onDeleteShip: () => void;
  onEditStart: () => void;
  onEditSave: (data: {
    name: string;
    description: string;
    member_only: boolean;
    member_approval_required: boolean;
  }) => void;
  onEditCancel: () => void;
  onToggleMemberManagement: () => void;
  onToggleMemberView: () => void;
  isJoining: boolean;
  isEditing: boolean;
  editFormData: {
    name: string;
    description: string;
    member_only: boolean;
    member_approval_required: boolean;
  };
  setEditFormData: (data: {
    name: string;
    description: string;
    member_only: boolean;
    member_approval_required: boolean;
  }) => void;
}

// 스타일 상수 - 글로벌 컬러 시스템 사용
const SHIP_STATUS_STYLES = {
  memberOnly: "px-3 py-1 text-sm bg-warning-100 text-warning-800 rounded-full",
  approvalRequired:
    "px-3 py-1 text-sm bg-warning-100 text-warning-800 rounded-full",
} as const;

const ROLE_STYLES = {
  captain:
    "px-3 py-1 text-sm font-medium rounded-full bg-error-100 text-error-800",
  mechanic:
    "px-3 py-1 text-sm font-medium rounded-full bg-info-100 text-info-800",
  crew: "px-3 py-1 text-sm font-medium rounded-full bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200",
} as const;

export function ShipHeader({
  ship,
  profile,
  locale,
  onJoinShip,
  onLeaveShip,
  onDeleteShip,
  onEditStart,
  onEditSave,
  onEditCancel,
  onToggleMemberManagement,
  onToggleMemberView,
  isJoining,
  isEditing,
  editFormData,
  setEditFormData,
}: ShipHeaderProps) {
  const { t } = useI18n();
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);

  const canManageMembers =
    ship?.userRole === "captain" || ship?.userRole === "mechanic";
  const canEditShip =
    ship?.userRole === "captain" || ship?.userRole === "mechanic";
  const canDeleteShip = ship?.userRole === "captain";

  // member_only 배 접근 제어
  const isMemberOnlyAccessDenied = ship?.member_only && !profile;
  const isMemberOnlyNotMember = ship?.member_only && profile && !ship?.isMember;

  const handleEditSave = () => {
    onEditSave(editFormData);
  };

  const handleJoinClick = () => {
    if (ship.member_approval_required) {
      setShowJoinRequestModal(true);
    } else {
      onJoinShip();
    }
  };

  const handleJoinRequestSubmit = (message: string) => {
    onJoinShip(message);
    setShowJoinRequestModal(false);
  };

  return (
    <div className="space-y-4">
      {/* member_only 배 접근 제어 메시지 - 카드 상단에 표시 */}
      {isMemberOnlyAccessDenied && (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-warning-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                {t("ships.memberOnlyTitle")}
              </h3>
              <div className="mt-2 text-sm text-warning-800">
                <p>{t("ships.memberOnlyMessageNotLoggedIn")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMemberOnlyNotMember && (
        <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-info-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-info-800">
                {t("ships.memberOnlyTitle")}
              </h3>
              <div className="mt-2 text-sm text-info-800">
                <p>{t("ships.memberOnlyMessageLoggedIn")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-muted rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("ships.shipName")}
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t("ships.shipNamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("ships.shipDescription")}
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                    placeholder={t("ships.shipDescriptionPlaceholder")}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.member_only}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          member_only: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">
                      {t("ships.memberOnly")}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editFormData.member_approval_required}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          member_approval_required: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">
                      {t("ships.memberApprovalRequired")}
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {ship.name}
                </h1>
                {ship.description && (
                  <p className="text-muted-foreground">{ship.description}</p>
                )}
                {/* <div className="text-sm text-muted-foreground mt-2">
                  <span>
                    {t("ships.createdAt")}:{" "}
                    {new Date(ship.created_at).toLocaleDateString()}
                  </span>
                </div> */}
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center space-x-2">
              {ship.member_only && (
                <span className={SHIP_STATUS_STYLES.memberOnly}>
                  {t("ships.memberOnly")}
                </span>
              )}
              {ship.member_approval_required && (
                <span className={SHIP_STATUS_STYLES.approvalRequired}>
                  {t("ships.memberApprovalRequired")}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between md:flex-row-reverse gap-4">
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleEditSave} variant="primary" size="sm">
                  {t("ships.save")}
                </Button>
                <Button onClick={onEditCancel} variant="secondary" size="sm">
                  {t("ships.cancel")}
                </Button>
              </>
            ) : (
              <>
                {ship.isMember ? (
                  <>
                    {canEditShip && (
                      <Button
                        onClick={onEditStart}
                        variant="secondary"
                        size="sm"
                      >
                        {t("ships.editShip")}
                      </Button>
                    )}

                    {canDeleteShip && (
                      <Button
                        onClick={onDeleteShip}
                        variant="secondary"
                        size="sm"
                        className="text-destructive hover:text-destructive-hover border-destructive/20 hover:border-destructive/40"
                      >
                        {t("ships.delete")}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    onClick={
                      profile &&
                      !ship.hasPendingRequest &&
                      !ship.hasRejectedRequest
                        ? handleJoinClick
                        : () => {
                            const currentPath = window.location.pathname;
                            window.location.href = `/${locale}/login?next=${encodeURIComponent(
                              currentPath
                            )}`;
                          }
                    }
                    disabled={
                      isJoining ||
                      ship.hasPendingRequest ||
                      ship.hasRejectedRequest
                    }
                    className={
                      ship.hasPendingRequest || ship.hasRejectedRequest
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary hover:bg-primary-hover text-primary-foreground"
                    }
                  >
                    {isJoining ? (
                      <LoadingSpinner size="sm" />
                    ) : ship.hasPendingRequest ? (
                      t("ships.pendingApproval")
                    ) : ship.hasRejectedRequest ? (
                      t("ships.cannotReapplyAfterRejection")
                    ) : profile ? (
                      ship.member_approval_required ? (
                        t("ships.requestToJoin")
                      ) : (
                        t("ships.join")
                      )
                    ) : (
                      t("ships.loginToJoin")
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {!isEditing && (
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex items-center gap-2">
                  {ship.userRole && (
                    <span className={ROLE_STYLES[ship.userRole]}>
                      {t(`ships.roles.${ship.userRole}`)}
                    </span>
                  )}
                  {/* <span>
                    {t("ships.memberCount", { count: ship.members.length })}
                  </span> */}
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManageMembers && (
                    <Button
                      onClick={onToggleMemberManagement}
                      variant="secondary"
                      size="sm"
                    >
                      {t("ships.manageMembers")}
                    </Button>
                  )}

                  {ship.userRole === "crew" && (
                    <Button
                      onClick={onToggleMemberView}
                      variant="secondary"
                      size="sm"
                    >
                      {t("ships.viewMembers")}
                    </Button>
                  )}
                  {ship.userRole && ship.userRole !== "captain" && (
                    <Button
                      onClick={onLeaveShip}
                      variant="secondary"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {t("ships.leave")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 가입 신청 모달 */}
      <JoinRequestModal
        isOpen={showJoinRequestModal}
        onClose={() => setShowJoinRequestModal(false)}
        onSubmit={handleJoinRequestSubmit}
        isSubmitting={isJoining}
      />
    </div>
  );
}
