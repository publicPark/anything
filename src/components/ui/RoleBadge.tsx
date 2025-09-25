"use client";

import { useI18n } from "@/hooks/useI18n";

export type ShipMemberRole = "captain" | "mechanic" | "crew";

interface RoleBadgeProps {
  role: ShipMemberRole;
  size?: "sm" | "md";
  className?: string;
}

// Match existing role badge styles used across the app (see ShipHeader ROLE_STYLES)
const ROLE_BASE_CLASS: Record<ShipMemberRole, string> = {
  captain: "role-captain",
  mechanic: "role-mechanic",
  crew: "role-crew",
};

const SIZE_CLASS: Record<NonNullable<RoleBadgeProps["size"]>, string> = {
  sm: "px-2 py-0.75 text-xs",
  md: "px-3 py-1 text-sm",
};

const EMOJI_BY_ROLE: Record<ShipMemberRole, string> = {
  captain: "👑",
  mechanic: "🛠️",
  crew: "👤",
};

const EMOJI_SIZE_CLASS: Record<NonNullable<RoleBadgeProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
};

export function RoleBadge({ role, size = "md", className = "" }: RoleBadgeProps) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`font-medium rounded-full ${SIZE_CLASS[size]} ${ROLE_BASE_CLASS[role]} ${className}`.trim()}
      >
        {t(`ships.roles.${role}`)}
      </span>
      <span aria-hidden="true" className={EMOJI_SIZE_CLASS[size]}>
        {EMOJI_BY_ROLE[role]}
      </span>
    </span>
  );
}


