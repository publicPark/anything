"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShipHeader } from "@/components/ShipHeader";
import { MemberList } from "@/components/MemberList";
import { Ship, ShipMember, Profile } from "@/types/database";

type ShipMemberRole = "captain" | "navigator" | "crew";

interface ShipWithDetails extends Ship {
  members: (ShipMember & { profile: Profile })[];
  userRole?: ShipMemberRole;
  isMember: boolean;
}

export default function ShipDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();

  const [ship, setShip] = useState<ShipWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showMemberView, setShowMemberView] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    member_only: false,
    member_approval_required: false,
  });

  const shipPublicId = params.public_id as string;

  // 프로필 로딩이 완료된 후에만 배 정보 가져오기 (멤버십 상태 정확히 반영)
  useEffect(() => {
    if (!profileLoading && shipPublicId) {
      fetchShipDetails();
    }
  }, [profileLoading, shipPublicId]);

  const fetchShipDetails = async () => {
    if (!shipPublicId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 배 정보 조회
      const { data: shipData, error: shipError } = await supabase
        .from("ships")
        .select("*")
        .eq("public_id", shipPublicId)
        .maybeSingle();

      if (shipError) {
        throw shipError;
      }

      if (!shipData) {
        throw new Error(t("ships.shipNotFound"));
      }

      // 배 멤버 정보 조회 (프로필 정보는 별도로 조회)
      const { data: members, error: membersError } = await supabase
        .from("ship_members")
        .select("*")
        .eq("ship_id", shipData.id);

      if (membersError) {
        throw membersError;
      }

      // 현재 사용자의 멤버십 확인 (로그인한 경우에만)
      const userMembership = profile
        ? members?.find((member) => member.user_id === profile.id)
        : null;

      // member_only 배에 대한 접근 제어는 UI에서 처리
      // 여기서는 에러를 던지지 않고 배 정보를 설정

      // 멤버들의 프로필 정보 조회
      const membersWithProfiles = await Promise.all(
        (members || []).map(async (member) => {
          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, display_name")
              .eq("id", member.user_id)
              .maybeSingle();

            return {
              ...member,
              profile: profileData || {
                username: `user_${member.user_id.slice(0, 8)}`,
                display_name: null,
              },
            };
          } catch (error) {
            // 프로필 조회 실패 시 기본값 사용
            return {
              ...member,
              profile: {
                username: `user_${member.user_id.slice(0, 8)}`,
                display_name: null,
              },
            };
          }
        })
      );

      setShip({
        ...shipData,
        members: membersWithProfiles,
        userRole: userMembership?.role,
        isMember: !!userMembership, // 실제 멤버십 상태로 설정
      });
    } catch (err: any) {
      console.error("Error fetching ship details:", err);
      setError(err.message || t("ships.errorLoadingShip"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinShip = async () => {
    if (!profile || !ship) return;

    setIsJoining(true);
    setError(null);

    try {
      const { error } = await supabase.rpc("join_ship", {
        ship_uuid: ship.id,
      });

      if (error) {
        throw error;
      }

      // 성공 시 페이지 새로고침
      await fetchShipDetails();
    } catch (err: any) {
      console.error("Error joining ship:", err);
      setError(err.message || t("ships.errorJoiningShip"));
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveShip = async () => {
    if (!profile || !ship) return;

    if (!confirm(t("ships.confirmLeaveShip"))) {
      return;
    }

    try {
      const { error } = await supabase
        .from("ship_members")
        .delete()
        .eq("ship_id", ship.id)
        .eq("user_id", profile.id);

      if (error) {
        throw error;
      }

      // 성공 시 페이지 새로고침
      await fetchShipDetails();
    } catch (err: any) {
      console.error("Error leaving ship:", err);
      setError(err.message || t("ships.errorLeavingShip"));
    }
  };

  const handleDeleteShip = async () => {
    if (!ship) return;

    if (!confirm(t("ships.confirmDeleteShip"))) {
      return;
    }

    try {
      const { error } = await supabase.from("ships").delete().eq("id", ship.id);

      if (error) {
        throw error;
      }

      // 성공 시 홈으로 이동
      router.push(`/${locale}`);
    } catch (err: any) {
      console.error("Error deleting ship:", err);
      setError(err.message || t("ships.errorDeletingShip"));
    }
  };

  const handleEditStart = () => {
    if (!ship) return;
    setEditFormData({
      name: ship.name,
      description: ship.description || "",
      member_only: ship.member_only,
      member_approval_required: ship.member_approval_required,
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditFormData({
      name: "",
      description: "",
      member_only: false,
      member_approval_required: false,
    });
  };

  const handleEditSave = async (data: {
    name: string;
    description: string;
    member_only: boolean;
    member_approval_required: boolean;
  }) => {
    if (!ship) return;

    try {
      const { error } = await supabase
        .from("ships")
        .update({
          name: data.name,
          description: data.description,
          member_only: data.member_only,
          member_approval_required: data.member_approval_required,
        })
        .eq("id", ship.id);

      if (error) {
        throw error;
      }

      setIsEditing(false);
      await fetchShipDetails(); // 배 정보 새로고침
    } catch (err: any) {
      console.error("Error updating ship:", err);
      setError(err.message || t("ships.errorUpdatingShip"));
    }
  };

  // 멤버 역할 변경 함수
  async function handleChangeRole(memberId: string, newRole: ShipMemberRole) {
    try {
      const { error } = await supabase.rpc("change_member_role", {
        member_uuid: memberId,
        new_role: newRole,
      });

      if (error) {
        throw error;
      }

      await fetchShipDetails();
    } catch (err: any) {
      console.error("Error changing member role:", err);
      setError(err.message || t("ships.errorChangingRole"));
    }
  }

  // 멤버 제거 함수
  async function handleRemoveMember(memberId: string) {
    if (!confirm(t("ships.confirmRemoveMember"))) {
      return;
    }

    try {
      const { error } = await supabase
        .from("ship_members")
        .delete()
        .eq("id", memberId);

      if (error) {
        throw error;
      }

      await fetchShipDetails();
    } catch (err: any) {
      console.error("Error removing member:", err);
      setError(err.message || t("ships.errorRemovingMember"));
    }
  }

  // 선장 양도 함수
  async function handleTransferCaptaincy(memberId: string, memberName: string) {
    if (!confirm(t("ships.transferCaptaincyConfirm", { name: memberName }))) {
      return;
    }

    try {
      const { error } = await supabase.rpc("transfer_captaincy", {
        new_captain_member_uuid: memberId,
      });

      if (error) {
        throw error;
      }

      await fetchShipDetails();
    } catch (err: any) {
      console.error("Error transferring captaincy:", err);
      setError(err.message || t("ships.errorTransferringCaptaincy"));
    }
  }

  if (isLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center py-8 px-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!ship) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <ErrorMessage message={t("ships.shipNotFound")} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <ShipHeader
        ship={ship}
        profile={profile}
        locale={locale}
        onJoinShip={handleJoinShip}
        onLeaveShip={handleLeaveShip}
        onDeleteShip={handleDeleteShip}
        onEditStart={handleEditStart}
        onEditSave={handleEditSave}
        onEditCancel={handleEditCancel}
        onToggleMemberManagement={() =>
          setShowMemberManagement(!showMemberManagement)
        }
        onToggleMemberView={() => setShowMemberView(!showMemberView)}
        isJoining={isJoining}
        isEditing={isEditing}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
      />

      <MemberList
        members={ship.members}
        currentUserId={profile?.id}
        showMemberManagement={showMemberManagement}
        showMemberView={showMemberView}
        userRole={ship.userRole}
        onPromoteToNavigator={(memberId) =>
          handleChangeRole(memberId, "navigator")
        }
        onDemoteToCrew={(memberId) => handleChangeRole(memberId, "crew")}
        onTransferCaptaincy={handleTransferCaptaincy}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
}
