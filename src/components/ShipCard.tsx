"use client";

import { useI18n } from "@/hooks/useI18n";
import { Ship, ShipMember, Profile } from "@/types/database";

type ShipMemberRole = "captain" | "navigator" | "crew";

// 스타일 상수 - 글로벌 컬러 시스템 사용
const ROLE_STYLES = {
  captain: "bg-error-100 text-error-800",
  navigator: "bg-info-100 text-info-800",
  crew: "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200",
} as const;

const SHIP_STATUS_STYLES = {
  memberOnly: "px-2 py-1 text-xs bg-warning-100 text-warning-800 rounded",
  approvalRequired: "px-2 py-1 text-xs bg-warning-100 text-warning-800 rounded",
} as const;

interface ShipWithDetails extends Ship {
  members?: (ShipMember & { profile: Profile })[];
  userRole?: ShipMemberRole;
}

interface ShipCardProps {
  ship: ShipWithDetails;
  onClick: (ship: ShipWithDetails) => void;
  showUserRole?: boolean;
  showStatus?: boolean;
  showMemberCount?: boolean;
  showCreatedAt?: boolean;
}

export function ShipCard({
  ship,
  onClick,
  showUserRole = false,
  showStatus = true,
  showMemberCount = true,
  showCreatedAt = true,
}: ShipCardProps) {
  const { t } = useI18n();

  const memberCount = ship.members?.length || 0;

  return (
    <div
      onClick={() => onClick(ship)}
      className="text-left bg-muted rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 border border-border"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground truncate">
          {ship.name}
        </h3>

        <div className="flex items-center space-x-1">
          {showUserRole && ship.userRole && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                ROLE_STYLES[ship.userRole]
              }`}
            >
              {t(`ships.roles.${ship.userRole}`)}
            </span>
          )}

          {showStatus && (
            <>
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
            </>
          )}
        </div>
      </div>

      {ship.description && (
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {ship.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {showMemberCount && (
          <span>{t("ships.memberCount", { count: memberCount })}</span>
        )}
        {showCreatedAt && (
          <span>{new Date(ship.created_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
