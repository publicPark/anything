"use client";

import { useI18n } from "@/hooks/useI18n";
import { MemberItem } from "@/components/MemberItem";
import { ShipMember, Profile } from "@/types/database";

type ShipMemberRole = "captain" | "navigator" | "crew";

interface MemberListProps {
  members: (ShipMember & { profile: Profile })[];
  currentUserId: string | undefined;
  showMemberManagement: boolean;
  showMemberView: boolean;
  userRole: ShipMemberRole | undefined;
  onPromoteToNavigator: (memberId: string) => void;
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
  onPromoteToNavigator,
  onDemoteToCrew,
  onTransferCaptaincy,
  onRemoveMember,
}: MemberListProps) {
  const { t } = useI18n();

  const canManageMembers = userRole === "captain" || userRole === "navigator";

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

      <div className="space-y-3">
        {sortedMembers.map((member) => (
          <MemberItem
            key={member.id}
            member={member}
            currentUserId={currentUserId}
            showManagement={showMemberManagement}
            canManage={userRole === "captain"}
            onPromoteToNavigator={onPromoteToNavigator}
            onDemoteToCrew={onDemoteToCrew}
            onTransferCaptaincy={onTransferCaptaincy}
            onRemoveMember={onRemoveMember}
          />
        ))}
      </div>
    </div>
  );
}
