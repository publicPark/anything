"use client";

import { useEffect } from "react";
import { useProfileStore } from "@/stores/profileStore";

/**
 * 사용자 프로필 관리 훅 (Zustand 기반)
 * - 프로필 조회 및 생성
 * - 인증 상태 변화 감지
 * - 자동 프로필 생성
 */
export function useProfile() {
  const {
    profile,
    loading,
    error,
    updateProfile,
    createProfile,
    fetchProfile,
    initialized,
    initializing,
  } = useProfileStore();

  useEffect(() => {
    // 아직 초기화되지 않았고 초기화 진행 중이 아니라면 프로필 조회
    if (!initialized && !initializing) {
      fetchProfile();
    }
  }, [initialized, initializing]); // fetchProfile 의존성 제거

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile,
  };
}
