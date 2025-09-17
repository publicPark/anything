import { Locale } from "./i18n";

/**
 * Locale helper functions to reduce inline locale checks
 */

/**
 * Get localized text based on locale
 */
export function getLocalizedText(
  locale: Locale,
  enText: string,
  koText: string
): string {
  return locale === "en" ? enText : koText;
}

/**
 * Common localized messages
 */
export const LOCALIZED_MESSAGES = {
  // Authentication
  auth: {
    serverError: (locale: Locale) =>
      getLocalizedText(
        locale,
        "There was a server error during authentication. Please try again.",
        "인증 중 서버 오류가 발생했습니다. 다시 시도해주세요."
      ),
    exchangeError: (locale: Locale) =>
      getLocalizedText(
        locale,
        "Failed to complete authentication. Please try again.",
        "인증 완료에 실패했습니다. 다시 시도해주세요."
      ),
    missingCode: (locale: Locale) =>
      getLocalizedText(
        locale,
        "Invalid authentication request. Please try logging in again.",
        "잘못된 인증 요청입니다. 다시 로그인해주세요."
      ),
    defaultError: (locale: Locale) =>
      getLocalizedText(
        locale,
        "An authentication error occurred. Please try again.",
        "인증 오류가 발생했습니다. 다시 시도해주세요."
      ),
  },

  // UI
  ui: {
    settings: (locale: Locale) => getLocalizedText(locale, "Settings", "설정"),
    tryAgain: (locale: Locale) =>
      getLocalizedText(locale, "Try Again", "다시 시도"),
    goHome: (locale: Locale) =>
      getLocalizedText(locale, "Go to Home", "홈으로 이동"),
    or: (locale: Locale) => getLocalizedText(locale, "or", "또는"),
    cancel: (locale: Locale) => getLocalizedText(locale, "Cancel", "취소"),
    delete: (locale: Locale) => getLocalizedText(locale, "Delete", "삭제"),
    deleteAccount: (locale: Locale) =>
      getLocalizedText(locale, "Delete Account", "계정 삭제"),
  },

  // Validation
  validation: {
    validEmail: (locale: Locale) =>
      getLocalizedText(
        locale,
        "Please enter a valid email address",
        "올바른 이메일 주소를 입력해주세요"
      ),
    userNotFound: (locale: Locale) =>
      getLocalizedText(locale, "User not found", "사용자를 찾을 수 없습니다"),
  },

  // Support
  support: {
    contactSupport: (locale: Locale) =>
      getLocalizedText(
        locale,
        "If this problem persists, please contact support.",
        "문제가 계속 발생하면 고객지원에 문의해주세요."
      ),
  },
} as const;
