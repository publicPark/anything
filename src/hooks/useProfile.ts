"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { ERROR_CODES } from "@/lib/constants";

/**
 * 사용자 프로필 관리 훅
 * - 프로필 조회 및 생성
 * - 인증 상태 변화 감지
 * - 자동 프로필 생성
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 프로필 생성 함수
  const createProfile = useCallback(
    async (userId: string, email: string): Promise<Profile> => {
      const { data, error } = await supabase.rpc("create_user_profile", {
        user_id: userId,
        user_email: email,
      });

      if (error) {
        throw new Error(`Profile creation failed: ${error.message}`);
      }

      if (!data) {
        throw new Error("Profile creation returned no data");
      }

      return data;
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
          .maybeSingle();

        if (error) {
          if (error.code === ERROR_CODES.PROFILE_NOT_FOUND) {
            // 프로필이 없는 경우 자동 생성
            try {
              const newProfile = await createProfile(user.id, user.email || "");
              setProfile(newProfile);
            } catch (createError) {
              // 중복 키 에러인 경우 (트리거로 이미 생성됨) 에러를 표시하지 않음
              if (
                createError instanceof Error &&
                createError.message.includes("duplicate key")
              ) {
                try {
                  const { data: existingProfile, error: fetchError } =
                    await supabase
                      .from("profiles")
                      .select("*")
                      .eq("id", user.id)
                      .single();

                  if (fetchError) {
                    setError("Failed to fetch existing profile");
                  } else {
                    setProfile(existingProfile);
                    setError(null); // 에러 상태 초기화
                  }
                } catch (fetchErr) {
                  setError("Failed to fetch existing profile");
                }
              } else {
                setError("Failed to create profile");
              }
            }
          } else {
            setError(error.message);
          }
        } else if (!data) {
          // 프로필이 없는 경우, 먼저 다시 한 번 확인 후 생성
          // 잠시 대기 후 다시 조회 (트리거가 프로필을 생성할 시간을 줌)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const { data: retryData, error: retryError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (retryData) {
            setProfile(retryData);
          } else if (!retryError) {
            // 여전히 프로필이 없으면 생성 시도
            try {
              const newProfile = await createProfile(user.id, user.email || "");
              setProfile(newProfile);
            } catch (createError) {
              // 중복 키 에러인 경우 (트리거로 이미 생성됨) 에러를 표시하지 않음
              if (
                createError instanceof Error &&
                createError.message.includes("duplicate key")
              ) {
                try {
                  const { data: existingProfile, error: fetchError } =
                    await supabase
                      .from("profiles")
                      .select("*")
                      .eq("id", user.id)
                      .single();

                  if (fetchError) {
                    setError("Failed to fetch existing profile");
                  } else {
                    setProfile(existingProfile);
                    setError(null); // 에러 상태 초기화
                  }
                } catch (fetchErr) {
                  setError("Failed to fetch existing profile");
                }
              } else {
                setError(
                  `Failed to create profile: ${
                    createError instanceof Error
                      ? createError.message
                      : "Unknown error"
                  }`
                );
              }
            }
          } else {
            setError(retryError.message);
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
