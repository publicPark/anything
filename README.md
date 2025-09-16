# NextJS + Supabase 인증 시스템

매직링크/구글 로그인과 프로필 관리가 가능한 Next.js 웹사이트입니다.

## 주요 기능

- ✅ 매직링크 로그인 (이메일 기반)
- ✅ Google OAuth 로그인
- ✅ 자동 프로필 생성
- ✅ 3단계 사용자 권한 (basic, premium, admin)
- ✅ 프로필 수정 기능
- ✅ 프로필 자동 생성 미들웨어

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 URL과 anon key를 복사합니다.

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 데이터베이스 스키마 설정

Supabase 대시보드의 SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행합니다.

### 5. 매직링크 설정

1. Supabase 대시보드의 Authentication > Settings에서 "Enable email confirmations"를 활성화합니다.
2. "Site URL"을 `http://localhost:3000` (개발용) 또는 배포 URL로 설정합니다.
3. "Redirect URLs"에 `http://localhost:3000/auth/callback`을 추가합니다.

### 6. Google OAuth 설정 (선택사항)

1. [Google Cloud Console](https://console.cloud.google.com)에서 OAuth 2.0 클라이언트 ID를 생성합니다.
2. Supabase 대시보드의 Authentication > Providers에서 Google을 활성화하고 클라이언트 ID와 시크릿을 설정합니다.
3. 리다이렉트 URL을 `https://your-project-ref.supabase.co/auth/v1/callback`로 설정합니다.

### 7. 개발 서버 실행

```bash
npm run dev
```

## 프로젝트 구조

```
src/
├── app/
│   ├── auth/callback/     # OAuth 콜백 처리
│   ├── login/            # 로그인 페이지
│   ├── profile/          # 프로필 페이지
│   └── page.tsx          # 메인 페이지
├── hooks/
│   └── useProfile.ts     # 프로필 관리 훅
├── lib/
│   └── supabase/         # Supabase 클라이언트 설정
├── types/
│   └── database.ts       # 데이터베이스 타입 정의
└── middleware.ts         # 인증 미들웨어
```

## 사용자 권한

- **basic**: 기본 사용자 권한
- **premium**: 프리미엄 사용자 권한
- **admin**: 관리자 권한

## 주요 기능 설명

### 자동 프로필 생성
- 사용자가 로그인하면 자동으로 프로필이 생성됩니다.
- 프로필이 없는 사용자는 어떤 페이지에서든 프로필 페이지로 리다이렉트됩니다.

### 프로필 관리
- 사용자명과 표시 이름을 수정할 수 있습니다.
- 사용자명은 중복될 수 없습니다.

### 인증 미들웨어
- 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트됩니다.
- 프로필이 없는 사용자는 프로필 페이지로 리다이렉트됩니다.

## 배포

### Vercel 배포

1. GitHub에 코드를 푸시합니다.
2. [Vercel](https://vercel.com)에서 프로젝트를 import합니다.
3. 환경변수를 설정합니다.
4. 배포합니다.

### 환경변수 설정 (배포 시)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 문제 해결

### 프로필이 생성되지 않는 경우
- Supabase 데이터베이스에서 `profiles` 테이블과 트리거가 올바르게 설정되었는지 확인합니다.
- RLS 정책이 올바르게 설정되었는지 확인합니다.

### Google 로그인이 작동하지 않는 경우
- Google Cloud Console에서 리다이렉트 URL이 올바르게 설정되었는지 확인합니다.
- Supabase에서 Google OAuth 설정이 올바른지 확인합니다.