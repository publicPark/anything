const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공
  dir: "./",
});

// Jest에 추가할 사용자 정의 설정
const customJestConfig = {
  // 테스트 환경 설정
  testEnvironment: "jsdom",

  // 테스트 실행 전 설정 파일
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // 테스트 파일 패턴 (더 구체적으로 지정)
  testMatch: [
    "**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)",
    "**/*.(test|spec).(js|jsx|ts|tsx)",
  ],

  // 커버리지 설정
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/index.{js,jsx,ts,tsx}",
  ],

  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

// createJestConfig는 Next.js가 Jest를 비동기적으로 로드할 수 있도록 하는 내보내기입니다
module.exports = createJestConfig(customJestConfig);
