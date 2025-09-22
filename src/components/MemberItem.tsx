"use client";

import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { ShipMember, Profile } from "@/types/database";

type ShipMemberRole = "captain" | "mechanic" | "crew";

interface MemberItemProps {
  member: ShipMember & { profile: Profile };
  currentUserId: string | undefined;
  showManagement: boolean;
  canManage: boolean;
  canTransferCaptaincy: boolean;
  onPromoteToMechanic: (memberId: string) => void;
  onDemoteToCrew: (memberId: string) => void;
  onTransferCaptaincy: (memberId: string, memberName: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function MemberItem({
  member,
  currentUserId,
  showManagement,
  canManage,
  canTransferCaptaincy,
  onPromoteToMechanic,
  onDemoteToCrew,
  onTransferCaptaincy,
  onRemoveMember,
}: MemberItemProps) {
  const { t } = useI18n();

  const isCurrentUser = member.user_id === currentUserId;
  const memberName =
    member.profile?.display_name || member.profile?.username || "Unknown User";

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-y-3 bg-muted rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
          {(member.profile?.display_name ||
            member.profile?.username ||
            "U")[0].toUpperCase()}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium text-foreground">{memberName}</p>

            {isCurrentUser && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground border border-primary shadow-sm">
                {t("ships.me")}
              </span>
            )}

            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.role === "captain"
                  ? "role-captain"
                  : member.role === "mechanic"
                  ? "role-mechanic"
                  : "role-crew"
              }`}
            >
              {t(`ships.roles.${member.role}`)}
            </span>
          </div>
        </div>
      </div>

      {/* 관리 기능은 관리 모드에서만 표시 */}
      {showManagement && canManage && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* 자기 강등 버튼: mechanic이 자신을 crew로 강등 */}
          {isCurrentUser && member.role === "mechanic" && (
            <Button
              onClick={() => onDemoteToCrew(member.id)}
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {t("ships.demoteToCrew")}
            </Button>
          )}
          {/* 승격 버튼: 선원을 항해사로 승격 (선장만 가능) */}
          {member.role === "crew" && canTransferCaptaincy && (
            <Button
              onClick={() => onPromoteToMechanic(member.id)}
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {t("ships.promoteToMechanic")}
            </Button>
          )}

          {/* 선장 양도 버튼: mechanic을 선장으로 승격 (선장만 가능) */}
          {member.role === "mechanic" && canTransferCaptaincy && (
            <Button
              onClick={() => onTransferCaptaincy(member.id, memberName)}
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground whitespace-nowrap"
            >
              {t("ships.transferCaptaincy")}
            </Button>
          )}

          {/* 강등 버튼: mechanic을 선원으로 강등 (선장만 가능) */}
          {member.role === "mechanic" && canTransferCaptaincy && (
            <Button
              onClick={() => onDemoteToCrew(member.id)}
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {t("ships.demoteToCrew")}
            </Button>
          )}

          {/* 제거 버튼: 멤버 제거 (자신 제외) */}
          {!isCurrentUser && (
            <Button
              onClick={() => onRemoveMember(member.id)}
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto text-destructive hover:text-destructive-hover border-destructive/20 hover:border-destructive/40 whitespace-nowrap"
            >
              {t("ships.removeMember")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
