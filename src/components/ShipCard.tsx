"use client";

import { useI18n } from "@/hooks/useI18n";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Ship, ShipMember, Profile, ShipMemberRole } from "@/types/database";

// 스타일 상수 - Tailwind CSS 디자인 토큰 사용

interface ShipWithDetails extends Ship {
  members?: (ShipMember & { profile: Profile })[];
  userRole?: ShipMemberRole;
}

interface ShipCardProps {
  ship: ShipWithDetails;
  onClick: (ship: ShipWithDetails) => void;
  showUserRole?: boolean;
  showMemberCount?: boolean;
  showCreatedAt?: boolean;
}

export function ShipCard({
  ship,
  onClick,
  showUserRole = false,
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

        {showUserRole && ship.userRole && (
          <RoleBadge role={ship.userRole} size="md" />
        )}
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
