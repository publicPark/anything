"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageVisit } from "@/lib/tracking";

/**
 * 페이지 방문 추적 컴포넌트
 * 모든 페이지 방문을 추적하여 마지막 방문 페이지를 저장
 */
export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 페이지 방문 추적
    trackPageVisit(pathname);
  }, [pathname]);

  return null; // UI 렌더링 없음
}
