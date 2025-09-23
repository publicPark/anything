"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useProfile } from "@/hooks/useProfile";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShipHeader } from "@/components/ShipHeader";
import { MemberList } from "@/components/MemberList";
import { MemberRequestList } from "@/components/MemberRequestList";
import { CabinManage } from "@/components/CabinManage";
import { ShipTabs } from "@/components/ShipTabs";
import {
  Ship,
  ShipMember,
  Profile,
  ShipMemberRequest,
  ShipMemberRole,
} from "@/types/database";

interface ShipWithDetails extends Ship {
  members: (ShipMember & { profile: Profile })[];
  userRole?: ShipMemberRole;
  isMember: boolean;
  hasPendingRequest?: boolean;
}

export default function ShipDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: profileLoading } = useProfile();

  const [ship, setShip] = useState<ShipWithDetails | null>(null);
  const [memberRequests, setMemberRequests] = useState<
    (ShipMemberRequest & { profiles: Profile | undefined })[]
  >([]);
  const [rejectedRequests, setRejectedRequests] = useState<
    (ShipMemberRequest & { profiles: Profile | undefined })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("viewMembers");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    member_only: false,
    member_approval_required: false,
  });
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false);
  const lastRejectedRequestId = useRef<string | null>(null);
  const lastApprovedRequestId = useRef<string | null>(null);

  const shipPublicId = params.public_id as string;

  // 에러 처리 함수
  const handleError = (err: unknown, defaultMessage: string) => {
    console.error(defaultMessage, err);

    let message = defaultMessage;

    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === "object") {
      // Supabase 에러 객체 처리
      const errorObj = err as any;
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
  };

  // 프로필 로딩이 완료된 후에만 배 정보 가져오기 (멤버십 상태 정확히 반영)
  useEffect(() => {
    if (!profileLoading && shipPublicId) {
      fetchShipDetails();
    }
  }, [profileLoading, shipPublicId]);

  // 승인 요청이 있으면 자동으로 멤버 가입 신청 탭으로 이동
  useEffect(() => {
    if (
      memberRequests.length > 0 &&
      (ship?.userRole === "captain" || ship?.userRole === "mechanic")
    ) {
      setActiveTab("memberRequests");
    }
  }, [memberRequests.length, ship?.userRole]);

  // crew 사용자가 관리 탭에 접근하려고 하면 viewMembers로 리다이렉트
  useEffect(() => {
    if (
      ship?.userRole === "crew" &&
      (activeTab === "memberRequests" || activeTab === "cabinsManage")
    ) {
      setActiveTab("viewMembers");
    }
  }, [ship?.userRole, activeTab]);

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

      // 사용자의 승인 요청 상태 확인
      let hasPendingRequest = false;
      if (profile && !userMembership) {
        const { data: userRequest } = await supabase
          .from("ship_member_requests")
          .select("id")
          .eq("ship_id", shipData.id)
          .eq("user_id", profile.id)
          .eq("status", "pending")
          .single();

        hasPendingRequest = !!userRequest;
      }

      // 현재 사용자가 거부된 요청이 있는지 확인
      let hasRejectedRequest = false;
      if (profile && !userMembership) {
        const { data: userRejectedRequest } = await supabase
          .from("ship_member_requests")
          .select("id")
          .eq("ship_id", shipData.id)
          .eq("user_id", profile.id)
          .eq("status", "rejected")
          .maybeSingle();

        hasRejectedRequest = !!userRejectedRequest;
      }

      setShip({
        ...shipData,
        members: membersWithProfiles,
        userRole: userMembership?.role,
        isMember: !!userMembership, // 실제 멤버십 상태로 설정
        hasPendingRequest,
        hasRejectedRequest,
      });

      // 승인 요청 가져오기 (선장 또는 mechanic만)
      if (
        userMembership?.role === "captain" ||
        userMembership?.role === "mechanic"
      ) {
        await fetchMemberRequests(shipData.id);
        await fetchRejectedRequests(shipData.id);
      }
    } catch (err: any) {
      handleError(err, t("ships.errorLoadingShip"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemberRequests = async (shipId: string) => {
    try {
      // 1. 승인 요청 가져오기
      const { data: requests, error: requestsError } = await supabase
        .from("ship_member_requests")
        .select("*")
        .eq("ship_id", shipId)
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      if (requestsError) {
        console.error(
          "Failed to fetch member requests:",
          requestsError.message
        );
        return;
      }

      if (!requests || requests.length === 0) {
        setMemberRequests([]);
        return;
      }

      // 2. 각 요청의 사용자 프로필 가져오기
      const userIds = requests.map((req) => req.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error("Failed to fetch profiles:", profilesError.message);
        setMemberRequests([]);
        return;
      }

      // 3. 요청과 프로필을 결합
      const requestsWithProfiles = requests.map((request) => {
        const userProfile = profiles?.find(
          (profile) => profile.id === request.user_id
        );
        return {
          ...request,
          profiles: userProfile,
        };
      });

      setMemberRequests(requestsWithProfiles);
    } catch (err) {
      console.error(
        "Failed to fetch member requests:",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const fetchRejectedRequests = async (shipId: string) => {
    try {
      // 거부된 요청 가져오기
      const { data: requests, error: requestsError } = await supabase.rpc(
        "get_rejected_requests",
        { ship_uuid: shipId }
      );

      if (requestsError) {
        console.error(
          "Failed to fetch rejected requests:",
          requestsError.message
        );
        return;
      }

      if (!requests || requests.length === 0) {
        setRejectedRequests([]);
        return;
      }

      // 각 요청의 사용자 프로필 가져오기
      const userIds = requests.map((req: ShipMemberRequest) => req.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error("Failed to fetch profiles:", profilesError.message);
        setRejectedRequests([]);
        return;
      }

      // 요청과 프로필 매칭
      const requestsWithProfiles = requests.map((req: ShipMemberRequest) => {
        const userProfile = profiles?.find((p) => p.id === req.user_id);
        return {
          ...req,
          profiles: userProfile,
        };
      });

      setRejectedRequests(requestsWithProfiles);
    } catch (err) {
      console.error(
        "Failed to fetch rejected requests:",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  const handleJoinShip = async (requestMessage?: string) => {
    if (!profile || !ship) return;

    setIsJoining(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("join_ship", {
        ship_uuid: ship.id,
        request_message: requestMessage || null,
      });

      if (error) {
        throw error;
      }

      // 결과에 따라 다른 메시지 표시
      if (data.type === "request") {
        // 승인 요청이 생성됨
        alert(t("ships.requestSent"));
        // 승인 요청 상태 업데이트
        setShip((prev) => (prev ? { ...prev, hasPendingRequest: true } : null));
      } else if (data.type === "member") {
        // 즉시 가입됨
        alert(t("ships.shipJoined"));
      }

      // 성공 시 페이지 새로고침
      await fetchShipDetails();
    } catch (err: any) {
      console.error(
        "Failed to join ship:",
        err instanceof Error ? err.message : String(err)
      );
      setError(err.message || t("ships.errorJoiningShip"));
    } finally {
      setIsJoining(false);
    }
  };

  const handleApproveRequest = async (
    requestId: string,
    reviewMessage?: string
  ) => {
    if (!ship) return;

    setIsProcessingRequest(true);
    setError(null);

    try {
      const { error } = await supabase.rpc("approve_member_request", {
        request_uuid: requestId,
        review_message: reviewMessage || null,
      });

      if (error) {
        throw error;
      }

      // 중복 알림 방지
      if (lastApprovedRequestId.current !== requestId) {
        alert(t("ships.requestApproved"));
        lastApprovedRequestId.current = requestId;
      }

      // 승인 요청 목록과 배 정보 새로고침
      await fetchMemberRequests(ship.id);
      await fetchShipDetails();

      // 데이터 새로고침 완료 후 로딩 상태 해제
      setIsProcessingRequest(false);
    } catch (err: any) {
      console.error(
        "Failed to approve member request:",
        err instanceof Error ? err.message : String(err)
      );
      setError(err.message || "Failed to approve request");
      setIsProcessingRequest(false);
    }
  };

  const handleRejectRequest = async (
    requestId: string,
    reviewMessage?: string
  ) => {
    if (!ship) return;

    setIsProcessingRequest(true);
    setError(null);

    try {
      const { error } = await supabase.rpc("reject_member_request", {
        request_uuid: requestId,
        review_message: reviewMessage || null,
      });

      if (error) {
        throw error;
      }

      // 중복 알림 방지
      if (lastRejectedRequestId.current !== requestId) {
        alert(t("ships.requestRejected"));
        lastRejectedRequestId.current = requestId;
      }

      // 승인 요청 목록 새로고침
      await fetchMemberRequests(ship.id);
      await fetchRejectedRequests(ship.id);

      // 데이터 새로고침 완료 후 로딩 상태 해제
      setIsProcessingRequest(false);
    } catch (err: any) {
      console.error(
        "Failed to reject member request:",
        err instanceof Error ? err.message : String(err)
      );
      setError(err.message || "Failed to reject request");
      setIsProcessingRequest(false);
    }
  };

  const handleResetRejectedRequest = async (requestId: string) => {
    if (!ship) return;

    setIsProcessingRequest(true);
    setError(null);

    try {
      const { error } = await supabase.rpc(
        "reset_rejected_request_to_pending",
        {
          request_uuid: requestId,
          review_msg: null,
        }
      );

      if (error) {
        throw error;
      }

      // 중복 알림 방지
      if (lastApprovedRequestId.current !== requestId) {
        alert(t("ships.requestResetToPending"));
        lastApprovedRequestId.current = requestId;
      }

      // 요청 목록 새로고침
      await fetchMemberRequests(ship.id);
      await fetchRejectedRequests(ship.id);

      // 데이터 새로고침 완료 후 로딩 상태 해제
      setIsProcessingRequest(false);
    } catch (err: any) {
      console.error(
        "Failed to reset rejected request:",
        err instanceof Error ? err.message : String(err)
      );
      setError(err.message || "Failed to reset rejected request");
      setIsProcessingRequest(false);
    }
  };

  const handleDeleteRejectedRequest = async (requestId: string) => {
    if (!ship) return;

    setIsProcessingRequest(true);
    setError(null);

    try {
      const { error } = await supabase.rpc("delete_rejected_request", {
        request_uuid: requestId,
      });

      if (error) {
        throw error;
      }

      alert(t("ships.requestDeleted"));

      // 거부된 요청 목록 새로고침
      await fetchRejectedRequests(ship.id);
    } catch (err: any) {
      console.error(
        "Failed to delete rejected request:",
        err instanceof Error ? err.message : String(err)
      );
      setError(err.message || "Failed to delete rejected request");
    } finally {
      setIsProcessingRequest(false);
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
      console.error(
        "Failed to delete ship:",
        err instanceof Error ? err.message : String(err)
      );
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

    // 입력값 검증
    if (!data.name.trim()) {
      setError(t("ships.shipNameRequired"));
      return;
    }

    try {
      setError(null); // 이전 에러 클리어
      setIsSaving(true);

      const { error } = await supabase
        .from("ships")
        .update({
          name: data.name.trim(),
          description: data.description.trim(),
          member_only: data.member_only,
          member_approval_required: data.member_approval_required,
        })
        .eq("id", ship.id);

      if (error) {
        throw error;
      }

      setIsEditing(false);
      await fetchShipDetails(); // 배 정보 새로고침

      // 성공 메시지 (선택사항)
      console.log("팀 정보가 성공적으로 업데이트되었습니다.");
    } catch (err: any) {
      console.error(
        "Failed to update ship:",
        err instanceof Error ? err.message : String(err)
      );
      setError(err.message || t("ships.errorUpdatingShip"));
    } finally {
      setIsSaving(false);
    }
  };

  // 탭 생성 함수
  const createTabs = useCallback(() => {
    if (!ship) return [];

    const tabs = [
      {
        id: "viewMembers",
        label: t("ships.viewMembers"),
        content: (
          <div className="space-y-6">
            <MemberList
              members={ship.members}
              currentUserId={profile?.id}
              showMemberManagement={
                ship.userRole === "captain" || ship.userRole === "mechanic"
              }
              showMemberView={true}
              userRole={ship.userRole}
              shipId={ship.id}
              onRefresh={fetchShipDetails}
            />
          </div>
        ),
      },
    ];

    // 관리자 전용 탭들
    if (ship.userRole === "captain" || ship.userRole === "mechanic") {
      // 멤버 가입 신청 탭
      tabs.push({
        id: "memberRequests",
        label: `${t("ships.memberRequests")}${
          memberRequests.length > 0 ? ` (${memberRequests.length})` : ""
        }`,
        content: (
          <div className="space-y-6">
            <MemberRequestList
              requests={memberRequests}
              rejectedRequests={rejectedRequests}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              onResetRejectedRequest={handleResetRejectedRequest}
              onDeleteRejectedRequest={handleDeleteRejectedRequest}
              isProcessing={isProcessingRequest}
              showRejectedRequests={true}
            />
          </div>
        ),
      });

      // 선실 관리 탭
      tabs.push({
        id: "cabinsManage",
        label: t("ships.cabinsManage"),
        content: (
          <div className="space-y-6">
            <CabinManage shipId={ship.id} userRole={ship.userRole} />
          </div>
        ),
      });
    }

    return tabs;
  }, [
    ship,
    profile?.id,
    memberRequests,
    rejectedRequests,
    handleApproveRequest,
    handleRejectRequest,
    handleResetRejectedRequest,
    handleDeleteRejectedRequest,
    isProcessingRequest,
    fetchShipDetails,
    t,
  ]);

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
        onDeleteShip={handleDeleteShip}
        onEditStart={handleEditStart}
        onEditSave={handleEditSave}
        onEditCancel={handleEditCancel}
        onViewCabins={() =>
          router.push(`/${locale}/ship/${shipPublicId}/cabins`)
        }
        isJoining={isJoining}
        isEditing={isEditing}
        isSaving={isSaving}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
      />

      {/* 탭 시스템 - member_only 배가 아니거나 멤버인 경우에만 표시 */}
      {(!ship.member_only || ship.isMember) && (
        <ShipTabs
          tabs={createTabs()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}
