export type UserRole = "titan" | "gaia" | "chaos";
export type ShipMemberRole = "captain" | "navigator" | "crew";

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
        };
        Returns: ShipMember;
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
