# 테스팅 환경 가이드

이 프로젝트는 Jest와 React Testing Library를 사용한 효율적인 테스팅 환경을 제공합니다.

## 🚀 빠른 시작

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 테스트 감시 모드 (파일 변경 시 자동 재실행)
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage

# CI 환경용 테스트
npm run test:ci
```

### 특정 테스트 실행

```bash
# 특정 파일의 테스트만 실행
npm test -- --testPathPatterns=Button.test.tsx

# 특정 패턴의 테스트 실행
npm test -- --testPathPatterns=components
```

## 📁 테스트 구조

```
src/
├── __tests__/                    # 테스트 유틸리티
│   ├── utils/                    # 테스트 헬퍼 및 목 데이터
│   │   ├── test-utils.tsx       # 커스텀 렌더 함수
│   │   └── mock-data.ts         # 테스트용 목 데이터
│   └── setup.ts                 # Jest 설정 파일
├── components/__tests__/        # 컴포넌트 단위 테스트
│   └── Button.test.tsx
└── hooks/__tests__/             # 훅 단위 테스트
    └── useI18n.test.ts
```

## 🛠️ 설정 파일

- `jest.config.js` - Jest 설정
- `jest.setup.js` - Jest 전역 설정
- `src/types/jest.d.ts` - TypeScript 타입 정의
- `tsconfig.json` - TypeScript 설정 (테스트 파일 포함)

## 📊 현재 테스트 현황

### 테스트 Suites (2개)

- **Button 컴포넌트**: 3개 테스트 (렌더링, 클릭 이벤트, disabled 상태)
- **useI18n 훅**: 3개 테스트 (번역 함수, 매개변수 처리, 에러 처리)

### 테스트 결과

- **총 테스트**: 6개
- **실행 시간**: ~0.5초
- **커버리지**: 설정됨 (70% 임계값)

## 🎯 테스트 전략

### 단위 테스트 (Unit Tests)

현재 모든 테스트는 **단위 테스트**로 구성되어 있습니다:

- **컴포넌트 테스트**: UI 컴포넌트의 핵심 기능 검증
- **훅 테스트**: 비즈니스 로직의 핵심 기능 검증

### 테스트 범위

- ✅ **Button 컴포넌트**: 기본 렌더링, 이벤트 처리, 상태 관리
- ✅ **useI18n 훅**: 번역 함수 동작, 매개변수 처리, 에러 처리
- ❌ **Ship 관련 기능**: 테스트 범위에서 제외
- ❌ **복잡한 통합 테스트**: 단순화를 위해 제외

## 🧪 테스트 작성 가이드

### 컴포넌트 테스트 예시

```typescript
import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import { Button } from "../ui/Button";

describe("Button", () => {
  it("기본 버튼을 렌더링한다", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" })
    ).toBeInTheDocument();
  });

  it("클릭 이벤트를 올바르게 처리한다", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 훅 테스트 예시

```typescript
import { renderHook } from "@testing-library/react";
import { useI18n } from "../useI18n";

describe("useI18n", () => {
  it("번역 함수를 반환하고 올바르게 동작한다", () => {
    const { result } = renderHook(() => useI18n());

    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe("function");
    expect(result.current.t("common.loading")).toBe("로딩 중...");
  });
});
```

## 🔧 테스트 유틸리티

### test-utils.tsx

- 커스텀 렌더 함수 (ThemeProvider 포함)
- Supabase 클라이언트 모킹
- 테스트용 데이터 및 헬퍼 함수

### mock-data.ts

- 기본 사용자 데이터
- API 응답 모킹
- 번역 키 모킹

## 📈 성능 및 품질

### 장점

- **빠른 실행**: 0.5초 내 완료
- **안정성**: 외부 의존성 없이 일관된 결과
- **유지보수성**: 핵심 기능만 테스트하여 관리 용이
- **가독성**: 테스트 의도가 명확함

### 모범 사례

- ✅ 핵심 기능만 테스트
- ✅ 명확한 테스트 이름
- ✅ 독립적인 테스트
- ✅ 빠른 실행 시간
- ❌ 과도한 세부사항 테스트
- ❌ 중복되는 테스트

## 🚀 다음 단계

필요에 따라 다음 테스트들을 추가할 수 있습니다:

1. **새로운 컴포넌트 테스트**
2. **새로운 훅 테스트**
3. **통합 테스트** (필요시)
4. **E2E 테스트** (필요시)

## 📚 참고 자료

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
