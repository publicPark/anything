import { test, expect } from "@playwright/test";
import {
  navigateToLogin,
  waitForPageLoad,
  TRANSLATIONS,
} from "./fixtures/test-helpers";

test.describe("인증 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 페이지 로드 대기
    await waitForPageLoad(page);
  });

  test("로그인 페이지 기본 요소 렌더링", async ({ page }) => {
    const locale = "ko";
    const t = TRANSLATIONS[locale];

    await navigateToLogin(page, locale);

    // 페이지 제목 확인
    await expect(page).toHaveTitle(new RegExp(t.metadata.title, "i"));

    // 로그인 페이지 제목 확인 (h2 태그로 구체적 지정)
    await expect(
      page.getByRole("heading", { name: t.login.title })
    ).toBeVisible();

    // 기본 UI 요소들 확인
    await expect(
      page.getByPlaceholder(new RegExp(t.login.email, "i"))
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: new RegExp(t.login.continue, "i") })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: new RegExp(t.login.googleLogin, "i") })
    ).toBeVisible();
  });

  test("이메일 유효성 검증", async ({ page }) => {
    const locale = "ko";
    const t = TRANSLATIONS[locale];

    await navigateToLogin(page, locale);

    // 잘못된 이메일 형식 입력
    await page.fill('input[type="email"]', "invalid-email");
    await page
      .getByRole("button", { name: new RegExp(t.login.continue, "i") })
      .click();

    // HTML5 validation 확인
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test("보호된 페이지 접근 제어", async ({ page }) => {
    // 로그인하지 않은 상태에서 프로필 페이지 접근 시도
    await page.goto("/ko/profile");
    await waitForPageLoad(page);

    // URL이 로그인 페이지로 변경되거나 로그인 관련 요소가 표시되는지 확인
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes("/login");

    if (!isRedirectedToLogin) {
      // 리다이렉트되지 않았다면 로그인 요구 메시지가 있는지 확인
      const hasLoginPrompt = await page
        .getByRole("link", { name: /로그인/i })
        .isVisible();
      expect(hasLoginPrompt).toBeTruthy();
    } else {
      expect(isRedirectedToLogin).toBeTruthy();
    }
  });
});
