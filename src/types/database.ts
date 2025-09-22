export type UserRole = "titan" | "gaia" | "chaos";
export type ShipMemberRole = "captain" | "mechanic" | "crew";
export type ApprovalStatus = "pending" | "approved" | "rejected";

// 확장된 타입들
export interface ShipWithDetails extends Ship {
  members?: (ShipMember & { profiles: Profile })[];
  userRole?: ShipMemberRole;
  isMember?: boolean;
  hasPendingRequest?: boolean;
  hasRejectedRequest?: boolean;
}

export interface ShipMemberRequestWithProfile extends ShipMemberRequest {
  profiles: Profile | undefined;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Ship {
  id: string;
  public_id: string;
  name: string;
  description: string | null;
  member_only: boolean;
  member_approval_required: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShipMember {
  id: string;
  ship_id: string;
  user_id: string;
  role: ShipMemberRole;
  joined_at: string;
}

export interface ShipMemberRequest {
  id: string;
  ship_id: string;
  user_id: string;
  status: ApprovalStatus;
  message: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_message: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at"> & {
          id: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      ships: {
        Row: Ship;
        Insert: Omit<Ship, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Ship, "id" | "created_at" | "updated_at">>;
      };
      ship_members: {
        Row: ShipMember;
        Insert: Omit<ShipMember, "id" | "joined_at">;
        Update: Partial<Omit<ShipMember, "id" | "joined_at">>;
      };
      ship_member_requests: {
        Row: ShipMemberRequest;
        Insert: Omit<
          ShipMemberRequest,
          "id" | "requested_at" | "reviewed_at" | "reviewed_by"
        >;
        Update: Partial<
          Omit<
            ShipMemberRequest,
            "id" | "requested_at" | "reviewed_at" | "reviewed_by"
          >
        >;
      };
    };
    Functions: {
      create_ship: {
        Args: {
          ship_name: string;
          ship_description?: string;
          is_member_only?: boolean;
          requires_approval?: boolean;
        };
        Returns: Ship;
      };
      join_ship: {
        Args: {
          ship_uuid: string;
          request_message?: string;
        };
        Returns: any; // JSON response with type and data
      };
      approve_member_request: {
        Args: {
          request_uuid: string;
          review_message?: string;
        };
        Returns: ShipMember;
      };
      reject_member_request: {
        Args: {
          request_uuid: string;
          review_message?: string;
        };
        Returns: ShipMemberRequest;
      };
      reset_rejected_request_to_pending: {
        Args: {
          request_uuid: string;
          review_msg?: string;
        };
        Returns: ShipMemberRequest;
      };
      delete_rejected_request: {
        Args: {
          request_uuid: string;
        };
        Returns: boolean;
      };
      get_rejected_requests: {
        Args: {
          ship_uuid: string;
        };
        Returns: ShipMemberRequest[];
      };
      change_member_role: {
        Args: {
          member_uuid: string;
          new_role: ShipMemberRole;
        };
        Returns: ShipMember;
      };
    };
  };
}
