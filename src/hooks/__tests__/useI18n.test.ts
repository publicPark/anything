import { renderHook } from "@testing-library/react";
import { useI18n } from "../useI18n";

// useI18n 훅 핵심 테스트
describe("useI18n", () => {
  it("번역 함수를 반환하고 올바르게 동작한다", () => {
    const { result } = renderHook(() => useI18n());

    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe("function");
    expect(result.current.t("common.loading")).toBe("로딩 중...");
  });

  it("매개변수가 있는 번역 키를 처리한다", () => {
    const { result } = renderHook(() => useI18n());

    expect(result.current.t("home.welcome", { name: "홍길동" })).toBe(
      "안녕하세요, 홍길동님!"
    );
  });

  it("존재하지 않는 번역 키는 그대로 반환한다", () => {
    const { result } = renderHook(() => useI18n());

    expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
  });
});
