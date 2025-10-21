/**
 * 페이지 방문 추적 유틸리티
 * 마지막 방문 페이지를 세션 스토리지에 저장하여 로그인 후 리다이렉트에 활용
 */

/**
 * 현재 페이지를 마지막 방문 페이지로 저장
 * @param pathname 현재 페이지 경로
 */
export function trackPageVisit(pathname: string): void {
  if (typeof window === "undefined") return;

  // 로그인/인증 페이지는 추적하지 않음
  if (pathname.includes("/login") || pathname.includes("/auth")) {
    return;
  }

  try {
    sessionStorage.setItem("lastVisitedPage", pathname);
  } catch (error) {
    console.warn("Failed to track page visit:", error);
  }
}

/**
 * 마지막 방문 페이지 가져오기
 * @returns 마지막 방문 페이지 경로 또는 null
 */
export function getLastVisitedPage(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return sessionStorage.getItem("lastVisitedPage");
  } catch (error) {
    console.warn("Failed to get last visited page:", error);
    return null;
  }
}

/**
 * 마지막 방문 페이지 삭제
 */
export function clearLastVisitedPage(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem("lastVisitedPage");
  } catch (error) {
    console.warn("Failed to clear last visited page:", error);
  }
}
