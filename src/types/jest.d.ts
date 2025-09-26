// Jest 및 Testing Library 타입 정의
import "@testing-library/jest-dom";

// Jest 매처 확장
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveValue(value: string | string[] | number): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDescription(text?: string | RegExp): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveFormValues(expectedValues: Record<string, unknown>): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toHaveStyle(css: string | Record<string, unknown>): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveErrorMessage(text?: string | RegExp): R;
    }
  }
}

export {};
