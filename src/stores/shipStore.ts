"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import {
  Ship,
  ShipMember,
  ShipMemberRequest,
  Profile,
  ShipMemberRole,
  ApprovalStatus,
  ShipWithDetails,
  ShipMemberRequestWithProfile,
} from "@/types/database";

// Export types
export type { ShipWithDetails, ShipMemberRequestWithProfile };

export interface ShipDetailState {
  // 배 정보
  currentShip: ShipWithDetails | null;
  ships: ShipWithDetails[];

  // 멤버 관련
  memberRequests: ShipMemberRequestWithProfile[];
  rejectedRequests: ShipMemberRequestWithProfile[];
  members: (ShipMember & { profile: Profile })[];

  // UI 상태
  loading: boolean;
  error: string | null;
  isJoining: boolean;
  isProcessingRequest: boolean;

  // 편집 상태
  isEditing: boolean;
  editFormData: {
    name: string;
    description: string;
    member_only: boolean;
    member_approval_required: boolean;
  };

  // 모달 상태
  showMemberManagement: boolean;
  showMemberView: boolean;
  hasRejectedRequest: boolean;

  // 액션
  setCurrentShip: (ship: ShipWithDetails | null) => void;
  setShips: (ships: ShipWithDetails[]) => void;
  setMemberRequests: (requests: ShipMemberRequestWithProfile[]) => void;
  setRejectedRequests: (requests: ShipMemberRequestWithProfile[]) => void;
  setMembers: (members: (ShipMember & { profile: Profile })[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsJoining: (isJoining: boolean) => void;
  setIsProcessingRequest: (isProcessing: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  setEditFormData: (data: Partial<ShipDetailState["editFormData"]>) => void;
  setShowMemberManagement: (show: boolean) => void;
  setShowMemberView: (show: boolean) => void;
  setHasRejectedRequest: (has: boolean) => void;

  // 비동기 액션
  fetchShipDetails: (shipPublicId: string) => Promise<void>;
  fetchAllShips: () => Promise<void>;
  fetchMemberRequests: (shipId: string) => Promise<void>;
  fetchRejectedRequests: (shipId: string) => Promise<void>;
  fetchMembers: (shipId: string) => Promise<void>;

  // 배 관련 액션
  createShip: (shipData: {
    name: string;
    description?: string;
    member_only?: boolean;
    member_approval_required?: boolean;
  }) => Promise<Ship | null>;

  updateShip: (shipId: string, updates: Partial<Ship>) => Promise<Ship | null>;

  // 멤버 관련 액션
  joinShip: (shipId: string, message?: string) => Promise<boolean>;
  leaveShip: (shipId: string) => Promise<boolean>;
  approveMemberRequest: (
    requestId: string,
    reviewMessage?: string
  ) => Promise<boolean>;
  rejectMemberRequest: (
    requestId: string,
    reviewMessage?: string
  ) => Promise<boolean>;
  resetRejectedRequest: (
    requestId: string,
    reviewMessage?: string
  ) => Promise<boolean>;
  deleteRejectedRequest: (requestId: string) => Promise<boolean>;
  changeMemberRole: (
    memberId: string,
    newRole: ShipMemberRole
  ) => Promise<boolean>;

  // 초기화
  resetShipDetail: () => void;
  resetAll: () => void;
}

export const useShipStore = create<ShipDetailState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      currentShip: null,
      ships: [],
      memberRequests: [],
      rejectedRequests: [],
      members: [],
      loading: false,
      error: null,
      isJoining: false,
      isProcessingRequest: false,
      isEditing: false,
      editFormData: {
        name: "",
        description: "",
        member_only: false,
        member_approval_required: false,
      },
      showMemberManagement: false,
      showMemberView: false,
      hasRejectedRequest: false,

      // 기본 액션
      setCurrentShip: (ship) => set({ currentShip: ship }),
      setShips: (ships) => set({ ships }),
      setMemberRequests: (requests) => set({ memberRequests: requests }),
      setRejectedRequests: (requests) => set({ rejectedRequests: requests }),
      setMembers: (members) => set({ members }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setIsJoining: (isJoining) => set({ isJoining }),
      setIsProcessingRequest: (isProcessing) =>
        set({ isProcessingRequest: isProcessing }),
      setIsEditing: (isEditing) => set({ isEditing }),
      setEditFormData: (data) =>
        set((state) => ({
          editFormData: { ...state.editFormData, ...data },
        })),
      setShowMemberManagement: (show) => set({ showMemberManagement: show }),
      setShowMemberView: (show) => set({ showMemberView: show }),
      setHasRejectedRequest: (has) => set({ hasRejectedRequest: has }),

      // 배 상세 정보 조회
      fetchShipDetails: async (shipPublicId: string) => {
        const { setLoading, setError, setCurrentShip } = get();
        const supabase = createClient();

        setLoading(true);
        setError(null);

        try {
          const { data: ship, error: shipError } = await supabase
            .from("ships")
            .select("*")
            .eq("public_id", shipPublicId)
            .single();

          if (shipError) {
            throw shipError;
          }

          if (ship) {
            setCurrentShip(ship);
            // 관련 데이터도 함께 조회
            await Promise.all([
              get().fetchMemberRequests(ship.id),
              get().fetchRejectedRequests(ship.id),
              get().fetchMembers(ship.id),
            ]);
          }
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "배 정보를 불러오는 중 오류가 발생했습니다.";
          console.error("Failed to fetch ship details:", errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },

      // 모든 배 조회
      fetchAllShips: async () => {
        const { setLoading, setError, setShips } = get();
        const supabase = createClient();

        setLoading(true);
        setError(null);

        try {
          const { data: ships, error } = await supabase
            .from("ships")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }

          setShips(ships || []);
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "배 목록을 불러오는 중 오류가 발생했습니다.";
          console.error("Failed to fetch ships:", errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },

      // 멤버 요청 조회
      fetchMemberRequests: async (shipId: string) => {
        const { setMemberRequests } = get();
        const supabase = createClient();

        try {
          const { data, error } = await supabase
            .from("ship_member_requests")
            .select(
              `
              *,
              profiles:user_id (
                id,
                username,
                display_name,
                role
              )
            `
            )
            .eq("ship_id", shipId)
            .eq("status", "pending")
            .order("requested_at", { ascending: false });

          if (error) {
            console.error("Failed to fetch member requests:", error.message);
            return;
          }

          setMemberRequests(data || []);
        } catch (err) {
          console.error(
            "Failed to fetch member requests:",
            err instanceof Error ? err.message : String(err)
          );
        }
      },

      // 거부된 요청 조회
      fetchRejectedRequests: async (shipId: string) => {
        const { setRejectedRequests } = get();
        const supabase = createClient();

        try {
          const { data, error } = await supabase
            .from("ship_member_requests")
            .select(
              `
              *,
              profiles:user_id (
                id,
                username,
                display_name,
                role
              )
            `
            )
            .eq("ship_id", shipId)
            .eq("status", "rejected")
            .order("reviewed_at", { ascending: false });

          if (error) {
            console.error("Failed to fetch rejected requests:", error.message);
            return;
          }

          setRejectedRequests(data || []);
        } catch (err) {
          console.error(
            "Failed to fetch rejected requests:",
            err instanceof Error ? err.message : String(err)
          );
        }
      },

      // 멤버 조회
      fetchMembers: async (shipId: string) => {
        const { setMembers } = get();
        const supabase = createClient();

        try {
          const { data, error } = await supabase
            .from("ship_members")
            .select(
              `
              *,
              profiles:user_id (
                id,
                username,
                display_name,
                role
              )
            `
            )
            .eq("ship_id", shipId)
            .order("joined_at", { ascending: true });

          if (error) {
            console.error("Failed to fetch members:", error.message);
            return;
          }

          setMembers(data || []);
        } catch (err) {
          console.error(
            "Failed to fetch members:",
            err instanceof Error ? err.message : String(err)
          );
        }
      },

      // 배 생성
      createShip: async (shipData) => {
        const { setError } = get();
        const supabase = createClient();

        try {
          const { data, error } = await supabase.rpc("create_ship", {
            ship_name: shipData.name,
            ship_description: shipData.description || null,
            is_member_only: shipData.member_only || false,
            requires_approval: shipData.member_approval_required || false,
          });

          if (error) {
            throw error;
          }

          return data;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "배 생성 중 오류가 발생했습니다.";
          console.error("Failed to create ship:", errorMessage);
          setError(errorMessage);
          return null;
        }
      },

      // 배 업데이트
      updateShip: async (shipId: string, updates: Partial<Ship>) => {
        const { setError, setCurrentShip } = get();
        const supabase = createClient();

        try {
          const { data, error } = await supabase
            .from("ships")
            .update(updates)
            .eq("id", shipId)
            .select()
            .single();

          if (error) {
            throw error;
          }

          setCurrentShip(data);
          return data;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "배 정보 업데이트 중 오류가 발생했습니다.";
          console.error("Failed to update ship:", errorMessage);
          setError(errorMessage);
          return null;
        }
      },

      // 배 가입
      joinShip: async (shipId: string, message?: string) => {
        const { setIsJoining, setError } = get();
        const supabase = createClient();

        setIsJoining(true);
        setError(null);

        try {
          const { data, error } = await supabase.rpc("join_ship", {
            ship_uuid: shipId,
            request_message: message || null,
          });

          if (error) {
            throw error;
          }

          return true;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "배 가입 중 오류가 발생했습니다.";
          console.error("Failed to join ship:", errorMessage);
          setError(errorMessage);
          return false;
        } finally {
          setIsJoining(false);
        }
      },

      // 배 탈퇴
      leaveShip: async (shipId: string) => {
        const { setError } = get();
        const supabase = createClient();

        try {
          const { error } = await supabase
            .from("ship_members")
            .delete()
            .eq("ship_id", shipId);

          if (error) {
            throw error;
          }

          return true;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "배 탈퇴 중 오류가 발생했습니다.";
          console.error("Failed to leave ship:", errorMessage);
          setError(errorMessage);
          return false;
        }
      },

      // 멤버 요청 승인
      approveMemberRequest: async (
        requestId: string,
        reviewMessage?: string
      ) => {
        const { setIsProcessingRequest, setError } = get();
        const supabase = createClient();

        setIsProcessingRequest(true);
        setError(null);

        try {
          const { data, error } = await supabase.rpc("approve_member_request", {
            request_uuid: requestId,
            review_message: reviewMessage || null,
          });

          if (error) {
            throw error;
          }

          return true;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "멤버 요청 승인 중 오류가 발생했습니다.";
          console.error("Failed to approve member request:", errorMessage);
          setError(errorMessage);
          return false;
        } finally {
          setIsProcessingRequest(false);
        }
      },

      // 멤버 요청 거부
      rejectMemberRequest: async (
        requestId: string,
        reviewMessage?: string
      ) => {
        const { setIsProcessingRequest, setError } = get();
        const supabase = createClient();

        setIsProcessingRequest(true);
        setError(null);

        try {
          const { data, error } = await supabase.rpc("reject_member_request", {
            request_uuid: requestId,
            review_message: reviewMessage || null,
          });

          if (error) {
            throw error;
          }

          return true;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "멤버 요청 거부 중 오류가 발생했습니다.";
          console.error("Failed to reject member request:", errorMessage);
          setError(errorMessage);
          return false;
        } finally {
          setIsProcessingRequest(false);
        }
      },

      // 거부된 요청을 대기 상태로 리셋
      resetRejectedRequest: async (
        requestId: string,
        reviewMessage?: string
      ) => {
        const { setIsProcessingRequest, setError } = get();
        const supabase = createClient();

        setIsProcessingRequest(true);
        setError(null);

        try {
          const { data, error } = await supabase.rpc(
            "reset_rejected_request_to_pending",
            {
              request_uuid: requestId,
              review_msg: reviewMessage || null,
            }
          );

          if (error) {
            throw error;
          }

          return true;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "요청 리셋 중 오류가 발생했습니다.";
          console.error("Failed to reset rejected request:", errorMessage);
          setError(errorMessage);
          return false;
        } finally {
          setIsProcessingRequest(false);
        }
      },

      // 거부된 요청 삭제
      deleteRejectedRequest: async (requestId: string) => {
        const { setIsProcessingRequest, setError } = get();
        const supabase = createClient();

        setIsProcessingRequest(true);
        setError(null);

        try {
          const { data, error } = await supabase.rpc(
            "delete_rejected_request",
            {
              request_uuid: requestId,
            }
          );

          if (error) {
            throw error;
          }

          return true;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "요청 삭제 중 오류가 발생했습니다.";
          console.error("Failed to delete rejected request:", errorMessage);
          setError(errorMessage);
          return false;
        } finally {
          setIsProcessingRequest(false);
        }
      },

      // 멤버 역할 변경
      changeMemberRole: async (memberId: string, newRole: ShipMemberRole) => {
        const { setError } = get();
        const supabase = createClient();

        try {
          const { data, error } = await supabase.rpc("change_member_role", {
            member_uuid: memberId,
            new_role: newRole,
          });

          if (error) {
            throw error;
          }

          return true;
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "멤버 역할 변경 중 오류가 발생했습니다.";
          console.error("Failed to change member role:", errorMessage);
          setError(errorMessage);
          return false;
        }
      },

      // 배 상세 상태 초기화
      resetShipDetail: () => {
        set({
          currentShip: null,
          memberRequests: [],
          rejectedRequests: [],
          members: [],
          loading: false,
          error: null,
          isJoining: false,
          isProcessingRequest: false,
          isEditing: false,
          editFormData: {
            name: "",
            description: "",
            member_only: false,
            member_approval_required: false,
          },
          showMemberManagement: false,
          showMemberView: false,
          hasRejectedRequest: false,
        });
      },

      // 전체 상태 초기화
      resetAll: () => {
        set({
          currentShip: null,
          ships: [],
          memberRequests: [],
          rejectedRequests: [],
          members: [],
          loading: false,
          error: null,
          isJoining: false,
          isProcessingRequest: false,
          isEditing: false,
          editFormData: {
            name: "",
            description: "",
            member_only: false,
            member_approval_required: false,
          },
          showMemberManagement: false,
          showMemberView: false,
          hasRejectedRequest: false,
        });
      },
    }),
    {
      name: "ship-store",
    }
  )
);

// 편의 훅들
export const useCurrentShip = () => {
  const { currentShip, loading, error } = useShipStore();
  return { currentShip, loading, error };
};

export const useShipActions = () => {
  const {
    fetchShipDetails,
    fetchAllShips,
    createShip,
    updateShip,
    joinShip,
    leaveShip,
    approveMemberRequest,
    rejectMemberRequest,
    resetRejectedRequest,
    deleteRejectedRequest,
    changeMemberRole,
    resetShipDetail,
    resetAll,
  } = useShipStore();

  return {
    fetchShipDetails,
    fetchAllShips,
    createShip,
    updateShip,
    joinShip,
    leaveShip,
    approveMemberRequest,
    rejectMemberRequest,
    resetRejectedRequest,
    deleteRejectedRequest,
    changeMemberRole,
    resetShipDetail,
    resetAll,
  };
};

export const useShipUI = () => {
  const {
    isJoining,
    isProcessingRequest,
    isEditing,
    editFormData,
    showMemberManagement,
    showMemberView,
    hasRejectedRequest,
    setIsJoining,
    setIsProcessingRequest,
    setIsEditing,
    setEditFormData,
    setShowMemberManagement,
    setShowMemberView,
    setHasRejectedRequest,
  } = useShipStore();

  return {
    isJoining,
    isProcessingRequest,
    isEditing,
    editFormData,
    showMemberManagement,
    showMemberView,
    hasRejectedRequest,
    setIsJoining,
    setIsProcessingRequest,
    setIsEditing,
    setEditFormData,
    setShowMemberManagement,
    setShowMemberView,
    setHasRejectedRequest,
  };
};
