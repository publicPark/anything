"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { ERROR_CODES } from "@/lib/constants";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const createProfile = useCallback(
    async (userId: string, email: string): Promise<Profile> => {
      try {
        const { data, error } = await supabase.rpc("create_user_profile", {
          user_id: userId,
          user_email: email,
        });

        if (error) {
          throw new Error(`Profile creation failed: ${error.message}`);
        }

        return data;
      } catch (err) {
        throw err;
      }
    },
    [supabase]
  );

  useEffect(() => {
    async function getProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code === ERROR_CODES.PROFILE_NOT_FOUND) {
            // 프로필이 없는 경우 자동 생성
            try {
              const newProfile = await createProfile(user.id, user.email || "");
              setProfile(newProfile);
            } catch (createError) {
              setError("Failed to create profile");
            }
          } else {
            setError(error.message);
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    getProfile();

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
      } else if (event === "SIGNED_IN") {
        // 로그인 시 프로필 다시 로드
        getProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, createProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setProfile(data);
    return data;
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile,
  };
}
