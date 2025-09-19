# 🚀 코딩 가이드라인

이 문서는 프로젝트의 코딩 표준과 원칙을 정의합니다. 모든 코드 작성 시 이 가이드라인을 따라야 합니다.

## 📋 목차

- [전체적인 구조 고려](#전체적인-구조-고려)
- [잠재적 문제 예방](#잠재적-문제-예방)
- [글로벌 스타일 활용](#글로벌-스타일-활용)
- [코드 품질](#코드-품질)
- [파일 구조](#파일-구조)
- [네이밍 컨벤션](#네이밍-컨벤션)

## 🏗️ 전체적인 구조 고려

### 컴포넌트 분리

- **단일 책임 원칙**: 각 컴포넌트는 하나의 명확한 역할만 담당
- **재사용성**: 공통 기능은 별도 컴포넌트로 분리
- **Props 인터페이스**: 모든 props에 TypeScript 타입 정의

### 데이터 흐름

- **상태 관리**: 로컬 상태는 `useState`, 전역 상태는 Zustand Store
- **Props drilling 최소화**: Zustand store를 통한 전역 상태 공유
- **비동기 처리**: 모든 API 호출에 적절한 로딩/에러 상태
- **의존성 관리**: `useEffect` 의존성 배열을 정확히 설정하여 불필요한 재렌더링 방지
- **Store 패턴**: 기능별로 store를 분리하여 관리 (profileStore, shipStore 등)

### 에러 처리

- **Try-catch**: 모든 비동기 작업에 에러 처리
- **사용자 친화적 메시지**: 기술적 에러를 사용자가 이해할 수 있는 메시지로 변환
- **Fallback UI**: 에러 발생 시 적절한 대체 UI 제공

## ⚠️ 잠재적 문제 예방

### 타입 안전성

```typescript
// ✅ 좋은 예
interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
}

// ❌ 나쁜 예
const user: any = { ... };
```

### RLS 정책 준수

- **Supabase RLS**: 모든 데이터베이스 접근이 RLS 정책과 일치
- **인증 상태 확인**: 로그인/비로그인 사용자 모두 고려
- **권한 검증**: 사용자 권한에 따른 접근 제어

### 반응형 디자인

- **Mobile-first**: 모바일 우선으로 디자인
- **Breakpoint 활용**: `sm:`, `md:`, `lg:` 적절히 사용
- **터치 친화적**: 모바일에서 터치하기 쉬운 버튼 크기

### 국제화 (i18n)

```typescript
// ✅ 좋은 예
const title = t("ships.title");

// ❌ 나쁜 예
const title = "Ships";
```

### 상태 동기화 및 로딩 순서

- **로딩 순서 고려**: 의존성이 있는 데이터는 로딩 순서를 고려하여 처리
- **중복 호출 방지**: 같은 데이터를 여러 번 가져오는 `useEffect` 중복 방지
- **일관된 상태**: 라우트 이동과 새로고침에서 동일한 화면 표시 보장

```typescript
// ✅ 좋은 예: Zustand store 사용
const { profile, loading } = useProfileStore();
const { fetchShipDetails } = useShipActions();

useEffect(() => {
  if (!loading && shipPublicId) {
    fetchShipDetails(shipPublicId);
  }
}, [loading, shipPublicId]);

// ❌ 나쁜 예: 중복 호출로 인한 상태 불일치
useEffect(() => {
  fetchShipDetails();
}, [shipPublicId]);
useEffect(() => {
  if (!profileLoading) fetchShipDetails();
}, [profileLoading]);
```

### 번역 키 관리

- **명확한 네이밍**: 번역 키는 용도가 명확하도록 명명
- **중복 제거**: 비슷한 용도의 키는 통합하여 관리
- **일관된 구조**: 관련 키들은 일관된 네이밍 패턴 사용

```typescript
// ✅ 좋은 예: 명확하고 간결한 키 구조
"memberOnlyTitle": "멤버 전용 배",
"memberOnlyMessageNotLoggedIn": "로그인하여 가입할 수 있습니다.",
"memberOnlyMessageLoggedIn": "버튼을 눌러 가입할 수 있습니다."

// ❌ 나쁜 예: 복잡하고 중복되는 키 구조
"memberOnlyAccessDenied": "...",
"memberOnlyTitle": "...",
"memberOnlyMessage": "...",
"memberOnlyJoinRequiredTitle": "...",
"memberOnlyJoinRequiredMessage": "..."
```

## 🎨 글로벌 스타일 활용

### Tailwind CSS 우선 사용

```typescript
// ✅ 좋은 예
<Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
  {t("common.submit")}
</Button>

// ❌ 나쁜 예
<button style={{ backgroundColor: '#007bff' }}>
  Submit
</button>
```

### 기존 컴포넌트 재사용

- **UI 컴포넌트**: `src/components/ui/` 폴더의 컴포넌트 우선 사용
- **공통 컴포넌트**: 기존에 만든 컴포넌트 최대한 활용
- **일관된 스타일**: 기존 디자인 시스템과 일치

### 반응형 클래스 패턴

```typescript
// 모바일: 세로 배치, 데스크톱: 가로 배치
<div className="flex flex-col md:flex-row gap-4">

// 모바일: 숨김, 데스크톱: 표시
<span className="hidden md:inline">Desktop Text</span>

// 모바일: 표시, 데스크톱: 숨김
<span className="md:hidden">Mobile Text</span>
```

## 📝 코드 품질

### 명확한 네이밍

```typescript
// ✅ 좋은 예
const handleUserLogin = async () => { ... };
const isUserAuthenticated = user !== null;

// ❌ 나쁜 예
const handleClick = () => { ... };
const flag = user !== null;
```

### 적절한 주석

```typescript
// ✅ 좋은 예
// 사용자 프로필을 생성하고 데이터베이스에 저장
const createUserProfile = async (userData: UserData) => {
  // ...
};

// ❌ 나쁜 예
// 함수
const func = () => {
  // ...
};
```

### 에러 메시지

```typescript
// ✅ 좋은 예
throw new Error(t("errors.profileCreationFailed"));

// ❌ 나쁜 예
throw new Error("Error");
```

## 📁 파일 구조

### 컴포넌트 파일

```
src/components/
├── ui/           # 재사용 가능한 UI 컴포넌트
├── [Feature]/    # 특정 기능별 컴포넌트
└── index.ts      # export 정리
```

### 페이지 파일

```
src/app/[locale]/
├── [feature]/
│   ├── page.tsx      # 메인 페이지
│   ├── loading.tsx   # 로딩 UI
│   └── error.tsx     # 에러 UI
```

### 훅 파일

```
src/hooks/
├── use[Feature].ts   # 기능별 커스텀 훅
└── index.ts          # export 정리
```

### Store 파일

```
src/stores/
├── [feature]Store.ts # 기능별 Zustand store
└── index.ts          # Store exports
```

## 🏷️ 네이밍 컨벤션

### 파일명

- **컴포넌트**: PascalCase (`UserProfile.tsx`)
- **훅**: camelCase with use prefix (`useUserProfile.ts`)
- **Store**: camelCase with Store suffix (`profileStore.ts`)
- **유틸리티**: camelCase (`formatDate.ts`)
- **페이지**: 소문자 (`page.tsx`)

### 변수/함수명

- **변수**: camelCase (`userName`, `isLoading`)
- **함수**: camelCase with verb (`handleSubmit`, `fetchUserData`)
- **상수**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **타입**: PascalCase (`UserProfile`, `ApiResponse`)

### CSS 클래스

- **Tailwind**: kebab-case (`bg-primary`, `text-center`)
- **커스텀**: BEM 방법론 (`button--primary`, `button__text`)

## 🔧 개발 도구

### 필수 확장 프로그램

- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 안전성
- **Tailwind CSS IntelliSense**: 클래스 자동완성

### 코드 검증

```bash
# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 포맷팅
npm run format
```

## 📚 참고 자료

### 프로젝트 구조

- **Next.js 14**: App Router 사용
- **Supabase**: 인증 및 데이터베이스
- **Tailwind CSS**: 스타일링
- **TypeScript**: 타입 안전성
- **i18n**: 국제화

### 주요 라이브러리

- `@supabase/ssr`: Supabase SSR 지원
- `zustand`: 상태 관리
- `@redux-devtools/extension`: 개발 도구 (Redux DevTools)
- `next-intl`: 국제화
- `tailwind-merge`: Tailwind CSS 클래스 병합
- `clsx`: 조건부 클래스명 처리

---

**이 가이드라인을 따라 일관되고 품질 높은 코드를 작성합시다!** 🚀
