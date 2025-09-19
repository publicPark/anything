# E2E 테스트 가이드

이 디렉토리는 Playwright를 사용한 End-to-End 테스트를 포함합니다.

## 🚀 빠른 시작

### 테스트 실행

```bash
# 모든 E2E 테스트 실행 (헤드리스)
npm run test:e2e

# UI 모드로 테스트 실행 (브라우저 표시)
npm run test:e2e:ui

# 헤드 모드로 테스트 실행 (브라우저 창 표시)
npm run test:e2e:headed

# 디버그 모드로 테스트 실행
npm run test:e2e:debug
```

### 특정 테스트 실행

```bash
# 인증 테스트만 실행
npx playwright test auth

# 특정 브라우저에서만 실행
npx playwright test --project=chromium

# 모바일 테스트만 실행
npx playwright test --project="Mobile Chrome"
```

## 📁 테스트 구조

```
tests/e2e/
├── fixtures/
│   ├── test-helpers.ts     # 공통 헬퍼 함수들
│   └── auth-helpers.ts     # 인증 관련 헬퍼 함수들
├── auth.spec.ts            # 기본 인증 플로우 테스트
├── auth-with-session-mock.spec.ts  # 실제 세션 테스트
└── README.md               # 이 파일
```

## 🧪 현재 구현된 테스트 (총 5개)

### 기본 인증 플로우 (auth.spec.ts) - 3개

- ✅ 로그인 페이지 기본 요소 렌더링
- ✅ 이메일 유효성 검증
- ✅ 보호된 페이지 접근 제어

### 실제 세션 테스트 (auth-with-session-mock.spec.ts) - 2개

- ✅ 실제 유효한 세션으로 프로필 페이지 접근
- ✅ 실제 유효한 세션으로 로그아웃 플로우

## 🛠️ 테스트 헬퍼 함수

### test-helpers.ts

- `navigateToLogin()` - 로그인 페이지로 이동
- `waitForPageLoad()` - 페이지 로딩 완료 대기
- `TRANSLATIONS` - 실제 번역 파일 import

### auth-helpers.ts

- `createValidTestSession()` - 실제 Supabase 세션 생성
- `setValidSession()` - 브라우저에 유효한 세션 설정
- `cleanupTestSession()` - 테스트 세션 정리

## ⚙️ 설정

### playwright.config.ts

- **Base URL**: `http://localhost:8000`
- **브라우저**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **리포터**: HTML 리포트
- **스크린샷**: 실패 시에만
- **비디오**: 실패 시 유지
- **트레이스**: 재시도 시에만

### 개발 서버 자동 시작

테스트 실행 시 자동으로 개발 서버(`npm run dev`)가 시작됩니다.

## 📊 테스트 결과 확인

### HTML 리포트

```bash
# 테스트 실행 후 리포트 열기
npx playwright show-report
```

### 트레이스 뷰어

실패한 테스트의 트레이스를 확인할 수 있습니다:

```bash
npx playwright show-trace test-results/auth-spec-chromium/trace.zip
```

## 🔧 디버깅

### Visual Studio Code

1. Playwright Test for VSCode 확장 설치
2. 테스트 파일에서 직접 실행/디버그 가능

### 브라우저 DevTools

```bash
# 디버그 모드로 테스트 실행
npm run test:e2e:debug
```

## 📝 테스트 작성 가이드

### 기본 구조

```typescript
import { test, expect } from "@playwright/test";
import { navigateToLogin } from "./fixtures/test-helpers";

test.describe("기능명", () => {
  test("테스트 시나리오 설명", async ({ page }) => {
    // 테스트 구현
    await navigateToLogin(page);
    await expect(page.getByText("로그인")).toBeVisible();
  });
});
```

### 모범 사례

1. **명확한 테스트 이름** - 무엇을 테스트하는지 명확히
2. **독립적인 테스트** - 다른 테스트에 의존하지 않음
3. **적절한 대기** - `waitForLoadState()`, `toBeVisible()` 사용
4. **헬퍼 함수 활용** - 중복 코드 최소화
5. **에러 시나리오 포함** - 실패 케이스도 테스트

## 🚨 주의사항

1. **환경 변수 설정**: 실제 세션 테스트를 위해 `TEST_EMAIL`, `TEST_PASSWORD` 필요
2. **Supabase 설정**: 테스트 계정이 Supabase에 존재해야 함
3. **테스트 격리**: 각 테스트는 독립적으로 실행됨

## 🔧 환경 변수 설정

### 필수 환경 변수 (.env.local)

```bash
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 선택적 환경 변수

```bash
# E2E 테스트용 계정 (선택사항 - 없으면 기본값 사용)
TEST_EMAIL=your-test@email.com
TEST_PASSWORD=your_test_password
```

### 기본 테스트 계정

환경 변수를 설정하지 않으면 다음 기본값을 사용:

- 이메일: `test-e2e@example.com`
- 비밀번호: `test_password_123!`

**⚠️ 주의**: 기본 테스트 계정을 Supabase에 미리 생성해야 합니다.

## 📈 향후 계획

- [ ] 배 관리 기능 E2E 테스트
- [ ] 멤버 관리 기능 E2E 테스트
- [ ] 권한별 기능 접근 테스트
- [ ] CI/CD 통합
