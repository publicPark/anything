"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { ERROR_CODES } from "@/lib/constants";

interface ProfileState {
  // 상태
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initializing: boolean; // 초기화 진행 중 상태 추가

  // 액션
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setInitializing: (initializing: boolean) => void;

  // 비동기 액션
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>;
  createProfile: (userId: string, email: string) => Promise<Profile>;
  clearProfile: () => void;

  // 인증 상태 변화 감지
  initializeAuthListener: () => () => void;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      profile: null,
      loading: true,
      error: null,
      initialized: false,
      initializing: false,

      // 기본 액션
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setInitialized: (initialized) => set({ initialized }),
      setInitializing: (initializing) => set({ initializing }),

      // 프로필 생성 함수
      createProfile: async (
        userId: string,
        email: string
      ): Promise<Profile> => {
        const supabase = createClient();
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

      // 프로필 조회
      fetchProfile: async () => {
        const {
          setLoading,
          setError,
          setProfile,
          createProfile,
          initialized,
          initializing,
        } = get();

        // 이미 초기화 완료되었거나 진행 중이면 중복 실행 방지
        if (initialized || initializing) {
          return;
        }

        // 초기화 진행 상태로 설정하여 중복 실행 방지
        set({ initializing: true });

        const supabase = createClient();
        setLoading(true);
        setError(null);

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
                const newProfile = await createProfile(
                  user.id,
                  user.email || ""
                );
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
                const newProfile = await createProfile(
                  user.id,
                  user.email || ""
                );
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
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          console.error("Profile fetch failed:", errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
          set({ initialized: true, initializing: false });
        }
      },

      // 프로필 업데이트
      updateProfile: async (updates: Partial<Profile>) => {
        const { profile, setProfile, setError } = get();
        const supabase = createClient();

        if (!profile) return null;

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
      },

      // 프로필 초기화
      clearProfile: () => {
        set({
          profile: null,
          loading: false,
          error: null,
          initialized: false,
          initializing: false,
        });
      },

      // 인증 상태 변화 감지 초기화
      initializeAuthListener: () => {
        const { fetchProfile, clearProfile, initialized } = get();
        const supabase = createClient();

        // 이미 초기화되었다면 중복 실행 방지
        if (initialized) {
          return () => {}; // 빈 cleanup 함수 반환
        }

        // 초기화 상태 설정
        set({ initialized: true });

        // 초기 프로필 로드
        fetchProfile();

        // 인증 상태 변화 감지
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT") {
            clearProfile();
          } else if (event === "SIGNED_IN") {
            // 로그인 시 프로필 다시 로드
            fetchProfile();
          }
        });

        return () => {
          subscription.unsubscribe();
          set({ initialized: false });
        };
      },
    }),
    {
      name: "profile-store",
    }
  )
);

// 편의 훅들
export const useProfile = () => {
  const { profile, loading, error, updateProfile, createProfile } =
    useProfileStore();
  return { profile, loading, error, updateProfile, createProfile };
};

export const useProfileActions = () => {
  const { fetchProfile, clearProfile, initializeAuthListener } =
    useProfileStore();
  return { fetchProfile, clearProfile, initializeAuthListener };
};
