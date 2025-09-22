"use client";

import { useI18n } from "@/hooks/useI18n";
import { MemberItem } from "@/components/MemberItem";
import { ShipMember, Profile } from "@/types/database";

type ShipMemberRole = "captain" | "mechanic" | "crew";

interface MemberListProps {
  members: (ShipMember & { profile: Profile })[];
  currentUserId: string | undefined;
  showMemberManagement: boolean;
  showMemberView: boolean;
  userRole: ShipMemberRole | undefined;
  onPromoteToMechanic: (memberId: string) => void;
  onDemoteToCrew: (memberId: string) => void;
  onTransferCaptaincy: (memberId: string, memberName: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function MemberList({
  members,
  currentUserId,
  showMemberManagement,
  showMemberView,
  userRole,
  onPromoteToMechanic,
  onDemoteToCrew,
  onTransferCaptaincy,
  onRemoveMember,
}: MemberListProps) {
  const { t } = useI18n();

  // 권한별 관리 가능 여부 결정
  const canManageMembers = userRole === "captain" || userRole === "mechanic";
  const canTransferCaptaincy = userRole === "captain";

  if (!showMemberManagement && !showMemberView) {
    return null;
  }

  const sortedMembers = members.sort(
    (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
  );

  return (
    <div className="bg-muted rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
        {showMemberManagement ? t("ships.manageMembers") : t("ships.members")}
      </h2>

      <div className="space-y-4">
        {sortedMembers.map((member) => {
          // 각 멤버별로 관리 권한 결정
          let canManageThisMember = false;

          if (userRole === "captain") {
            // 선장은 모든 멤버 관리 가능 (자신 제외)
            canManageThisMember = member.user_id !== currentUserId;
          } else if (userRole === "mechanic") {
            // mechanic은 선원만 관리 가능 (자신, 다른 mechanic, 선장 제외)
            canManageThisMember =
              member.role === "crew" && member.user_id !== currentUserId;
          }

          return (
            <MemberItem
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              showManagement={showMemberManagement}
              canManage={canManageThisMember}
              canTransferCaptaincy={canTransferCaptaincy}
              onPromoteToMechanic={onPromoteToMechanic}
              onDemoteToCrew={onDemoteToCrew}
              onTransferCaptaincy={onTransferCaptaincy}
              onRemoveMember={onRemoveMember}
            />
          );
        })}
      </div>
    </div>
  );
}
