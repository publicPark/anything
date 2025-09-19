import { Page, expect } from "@playwright/test";
import koTranslations from "../../../src/locales/ko.json";
import enTranslations from "../../../src/locales/en.json";

/**
 * E2E 테스트용 헬퍼 함수들 (인증 플로우 전용)
 */

// 실제 번역 파일에서 불러온 번역 텍스트
export const TRANSLATIONS = {
  ko: koTranslations,
  en: enTranslations,
} as const;

/**
 * 로그인 페이지로 이동하여 기본 요소들이 로드되었는지 확인
 */
export async function navigateToLogin(page: Page, locale: "ko" | "en" = "ko") {
  await page.goto(`/${locale}/login`);
  await waitForPageLoad(page);

  // 로그인 페이지 기본 요소들이 로드되었는지 확인 (타임아웃 증가)
  await expect(page.locator('input[type="email"]')).toBeVisible({
    timeout: 10000,
  });
  await expect(
    page.getByRole("button", { name: /continue|계속/i })
  ).toBeVisible({ timeout: 10000 });
}

/**
 * 페이지 로딩 완료 대기 (네트워크 요청 완료까지)
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}
