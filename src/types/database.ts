export type UserRole = 'basic' | 'premium' | 'admin'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id: string
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
