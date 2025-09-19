import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Page, expect } from "@playwright/test";
import { Session } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

/**
 * 실제 Supabase 인증을 통한 유효한 세션 생성
 */

// 환경 변수 로드 (테스트 실행 시점에서) - 시스템 환경 변수 덮어쓰기
dotenv.config({ path: ".env.local", override: true });

/**
 * Supabase 설정을 환경 변수에서 가져오기 (필수)
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "❌ Supabase 환경 변수가 설정되지 않았습니다.\n" +
        "다음 환경 변수를 .env.local에 설정해주세요:\n" +
        "- NEXT_PUBLIC_SUPABASE_URL\n" +
        "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  console.log("🔧 환경 변수: ✅ 사용");
  return { url, key };
}

/**
 * 테스트용 Supabase 클라이언트 생성
 */
function createTestSupabaseClient() {
  const config = getSupabaseConfig();

  console.log(`🔗 Supabase URL: ${config.url}`);
  console.log(`🔑 API Key: ${config.key.substring(0, 20)}...`);

  return createClient(config.url, config.key);
}

/**
 * 테스트용 계정 정보 가져오기 (환경 변수 필수)
 */
function getTestAccount() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "❌ 테스트 계정 환경 변수가 설정되지 않았습니다.\n" +
        "다음 환경 변수를 .env.local에 설정해주세요:\n" +
        "- TEST_EMAIL=your-test@email.com\n" +
        "- TEST_PASSWORD=your_test_password\n\n" +
        "또는 Supabase에 기본 테스트 계정을 생성해주세요."
    );
  }

  console.log(`📧 테스트 계정: ✅ 환경변수 (${email})`);
  return { email, password };
}

/**
 * 테스트 계정 생성 헬퍼 함수
 */
async function createTestAccount(
  supabase: SupabaseClient,
  testAccount: { email: string; password: string }
) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testAccount.email,
    password: testAccount.password,
    options: {
      data: {
        username: "e2e-test-user",
        display_name: "E2E Test User",
      },
    },
  });

  if (signUpError) {
    throw new Error(`테스트 계정 생성 실패: ${signUpError.message}`);
  }

  // 이메일 확인이 필요한 경우 처리
  if (signUpData.user && !signUpData.session) {
    throw new Error(
      "이메일 확인이 필요합니다. Supabase 설정에서 이메일 확인을 비활성화하거나 테스트 계정을 미리 생성해주세요."
    );
  }

  return signUpData;
}

/**
 * 테스트용 계정으로 실제 로그인하여 유효한 세션 생성
 */
export async function createValidTestSession() {
  const supabase = createTestSupabaseClient();
  const testAccount = getTestAccount();

  try {
    // 1. 테스트 계정으로 로그인 시도
    let { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: testAccount.email,
        password: testAccount.password,
      });

    // 2. 로그인 실패 시 계정 생성 시도
    if (signInError) {
      throw new Error(`로그인 실패: ${signInError.message}`);
    }

    // 3. 세션 검증
    if (!signInData?.session) {
      throw new Error("세션 생성 실패");
    }

    console.log("✅ 유효한 Supabase 세션 생성 성공");
    return signInData.session;
  } catch (error) {
    console.error("❌ 테스트 세션 생성 실패:", error);
    throw error;
  }
}

/**
 * 페이지에 유효한 Supabase 세션 설정
 */
export async function setValidSession(page: any) {
  try {
    const session = await createValidTestSession();

    // localStorage에 실제 세션 저장 (Supabase 클라이언트가 사용)
    await page.addInitScript((sessionData: any) => {
      const storageKey = `sb-${window.location.hostname}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify(sessionData));

      // 추가 키도 설정
      localStorage.setItem(
        "sb-localhost-auth-token",
        JSON.stringify(sessionData)
      );

      console.log("✅ 유효한 세션이 localStorage에 설정됨");
    }, session);

    // 쿠키에도 실제 토큰 설정
    await page.context().addCookies([
      {
        name: "sb-access-token",
        value: session.access_token,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
      {
        name: "sb-refresh-token",
        value: session.refresh_token,
        domain: "localhost",
        path: "/",
        httpOnly: false, // 테스트에서는 접근 가능하도록
        secure: false,
        sameSite: "Lax",
      },
    ]);

    return session;
  } catch (error) {
    console.error("❌ 유효한 세션 설정 실패:", error);
    throw error;
  }
}

/**
 * 테스트 후 정리 (세션 무효화)
 */
export async function cleanupTestSession() {
  try {
    const supabase = createTestSupabaseClient();
    await supabase.auth.signOut();
    console.log("✅ 테스트 세션 정리 완료");
  } catch (error) {
    console.log("⚠️ 테스트 세션 정리 중 오류:", error);
  }
}
