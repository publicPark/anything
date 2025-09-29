"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/hooks/useI18n";
import { MemberItem } from "@/components/MemberItem";
import { ShipMember, Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";

type ShipMemberRole = "captain" | "mechanic" | "crew";

interface MemberListProps {
  members: (ShipMember & { profile: Profile })[];
  currentUserId: string | undefined;
  showMemberManagement: boolean;
  showMemberView: boolean;
  userRole: ShipMemberRole | undefined;
  shipId: string;
  onRefresh: () => void; // 데이터 새로고침용
}

export function MemberList({
  members,
  currentUserId,
  showMemberManagement,
  showMemberView,
  userRole,
  shipId,
  onRefresh,
}: MemberListProps) {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 권한별 관리 가능 여부 결정
  const canManageMembers = userRole === "captain" || userRole === "mechanic";
  const canTransferCaptaincy = userRole === "captain";

  // 공통 에러 처리 함수
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    console.error(defaultMessage, err);

    let message = defaultMessage;

    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === "object") {
      // Supabase 에러 객체 처리
      const errorObj = err as {
        message?: string;
        error?: { message?: string };
        details?: string;
        hint?: string;
      };
      if (errorObj.message) {
        message = errorObj.message;
      } else if (errorObj.error?.message) {
        message = errorObj.error.message;
      } else if (errorObj.details) {
        message = errorObj.details;
      } else if (errorObj.hint) {
        message = errorObj.hint;
      }
    } else if (typeof err === "string") {
      message = err;
    }

    setError(message);
  }, []);

  // 공통 비동기 작업 래퍼
  const executeAsync = useCallback(
    async (operation: () => Promise<void>) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setError(null);

      try {
        await operation();
      } catch (err) {
        handleError(err, t("ships.errorGeneric"));
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, handleError, t]
  );

  // 멤버 역할 변경 함수
  const handleChangeRole = useCallback(
    (memberId: string, newRole: ShipMemberRole) => {
      executeAsync(async () => {
        const { error } = await supabase.rpc("change_member_role", {
          member_uuid: memberId,
          new_role: newRole,
        });

        if (error) throw error;
        onRefresh();
      });
    },
    [executeAsync, supabase, onRefresh]
  );

  // 멤버 제거 함수
  const handleRemoveMember = useCallback(
    (memberId: string) => {
      if (!confirm(t("ships.confirmRemoveMember"))) return;

      executeAsync(async () => {
        const { error } = await supabase
          .from("ship_members")
          .delete()
          .eq("id", memberId);

        if (error) throw error;
        onRefresh();
      });
    },
    [executeAsync, supabase, onRefresh, t]
  );

  // 선장 양도 함수
  const handleTransferCaptaincy = useCallback(
    (memberId: string, memberName: string) => {
      if (!confirm(t("ships.transferCaptaincyConfirm", { name: memberName })))
        return;

      executeAsync(async () => {
        const { error } = await supabase.rpc("transfer_captaincy", {
          new_captain_member_uuid: memberId,
        });

        if (error) throw error;
        onRefresh();
      });
    },
    [executeAsync, supabase, onRefresh, t]
  );

  // 배 탈퇴 함수
  const handleLeaveShip = useCallback(() => {
    // Crew가 아닌 경우 이유를 알려주고 종료
    if (userRole === "captain") {
      confirm(t("ships.cannotLeaveAsCaptain"));
      return;
    } else if (userRole === "mechanic") {
      confirm(t("ships.cannotLeaveAsMechanic"));
      return;
    }

    if (!confirm(t("ships.confirmLeaveShip"))) return;

    executeAsync(async () => {
      const { error } = await supabase
        .from("ship_members")
        .delete()
        .eq("ship_id", shipId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      // 탈퇴 후 홈으로 이동
      window.location.href = "/";
    });
  }, [executeAsync, supabase, shipId, currentUserId, userRole, t]);

  // 멤버 정렬 함수
  const sortMembers = useCallback(
    (members: (ShipMember & { profile: Profile })[]) => {
      return [...members].sort((a, b) => {
        // 1. 내가 가장 위에
        if (a.user_id === currentUserId) return -1;
        if (b.user_id === currentUserId) return 1;

        // 2. 직급 순대로 (captain > mechanic > crew)
        const roleOrder = { captain: 0, mechanic: 1, crew: 2 };
        const roleDiff = roleOrder[a.role] - roleOrder[b.role];
        if (roleDiff !== 0) return roleDiff;

        // 3. 멤버 가입 순대로
        return (
          new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        );
      });
    },
    [currentUserId]
  );

  // 멤버별 관리 권한 결정 함수
  const getMemberManagementPermission = useCallback(
    (member: ShipMember) => {
      if (userRole === "captain") {
        // 선장은 모든 멤버 관리 가능 (자신 제외)
        return member.user_id !== currentUserId;
      } else if (userRole === "mechanic") {
        // mechanic은 선원 관리 가능 + 자신 강등 가능
        return (
          (member.role === "crew" && member.user_id !== currentUserId) ||
          (member.user_id === currentUserId && member.role === "mechanic")
        );
      }
      return false;
    },
    [userRole, currentUserId]
  );

  if (!showMemberManagement && !showMemberView) {
    return null;
  }

  const sortedMembers = sortMembers(members);

  return (
    <div className="bg-muted rounded-lg shadow-md p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-foreground">
          {showMemberManagement ? t("ships.manageMembers") : t("ships.members")}
        </h2>
        {/* Leave 버튼 - 로그인한 사용자에게만 표시 */}
        {currentUserId && userRole && (
          <Button
            onClick={handleLeaveShip}
            disabled={isProcessing}
            variant={userRole === "crew" ? "destructive" : "secondary"}
            size="sm"
            className={
              userRole !== "crew" ? "opacity-50 cursor-not-allowed" : ""
            }
          >
            {isProcessing ? t("common.processing") : t("ships.leave")}
          </Button>
        )}
      </div>

      {/* 에러 메시지 표시 */}
      {error && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
          variant="destructive"
        />
      )}

      <div className="space-y-0">
        {sortedMembers.map((member, index) => {
          const canManageThisMember = getMemberManagementPermission(member);
          const isLastMember = index === sortedMembers.length - 1;

          return (
            <div key={member.id}>
              <MemberItem
                member={member}
                currentUserId={currentUserId}
                showManagement={showMemberManagement}
                canManage={canManageThisMember}
                canTransferCaptaincy={canTransferCaptaincy}
                onPromoteToMechanic={(memberId) =>
                  handleChangeRole(memberId, "mechanic")
                }
                onDemoteToCrew={(memberId) =>
                  handleChangeRole(memberId, "crew")
                }
                onTransferCaptaincy={handleTransferCaptaincy}
                onRemoveMember={handleRemoveMember}
              />
              {!isLastMember && (
                <div className="my-4 border-t border-border/50"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
