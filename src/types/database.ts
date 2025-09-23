export type UserRole = "titan" | "gaia" | "chaos";
export type ShipMemberRole = "captain" | "mechanic" | "crew";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ReservationStatus = "confirmed" | "cancelled";

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

export interface ShipCabin {
  id: string;
  ship_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CabinReservation {
  id: string;
  cabin_id: string;
  user_id: string | null;
  start_time: string;
  end_time: string;
  purpose: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
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
      ship_cabins: {
        Row: ShipCabin;
        Insert: Omit<ShipCabin, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ShipCabin, "id" | "created_at" | "updated_at">>;
      };
      cabin_reservations: {
        Row: CabinReservation;
        Insert: Omit<CabinReservation, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<CabinReservation, "id" | "created_at" | "updated_at">
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
      create_ship_cabin: {
        Args: {
          ship_uuid: string;
          cabin_name: string;
          cabin_description?: string;
        };
        Returns: ShipCabin;
      };
      update_ship_cabin: {
        Args: {
          cabin_uuid: string;
          cabin_name: string;
          cabin_description?: string;
        };
        Returns: ShipCabin;
      };
      delete_ship_cabin: {
        Args: {
          cabin_uuid: string;
        };
        Returns: boolean;
      };
      create_cabin_reservation: {
        Args: {
          cabin_uuid: string;
          reservation_start_time: string;
          reservation_end_time: string;
          reservation_purpose: string;
        };
        Returns: CabinReservation;
      };
      update_cabin_reservation: {
        Args: {
          reservation_uuid: string;
          new_start_time: string;
          new_end_time: string;
          new_purpose: string;
        };
        Returns: CabinReservation;
      };
      delete_cabin_reservation: {
        Args: {
          reservation_uuid: string;
        };
        Returns: boolean;
      };
    };
  };
}
