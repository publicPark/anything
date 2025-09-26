import { Locale, t } from "./i18n";

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
    serverError: (locale: Locale) => t("errors.auth.serverError", locale),
    exchangeError: (locale: Locale) => t("errors.auth.exchangeError", locale),
    missingCode: (locale: Locale) => t("errors.auth.missingCode", locale),
    defaultError: (locale: Locale) => t("errors.auth.defaultError", locale),
  },

  // UI
  ui: {
    settings: (locale: Locale) => t("ui.settings", locale),
    tryAgain: (locale: Locale) => t("ui.tryAgain", locale),
    goHome: (locale: Locale) => t("ui.goHome", locale),
    or: (locale: Locale) => t("ui.or", locale),
    cancel: (locale: Locale) => t("ui.cancel", locale),
    delete: (locale: Locale) => t("ui.delete", locale),
    deleteAccount: (locale: Locale) => t("ui.deleteAccount", locale),
  },

  // Validation
  validation: {
    validEmail: (locale: Locale) => t("errors.validation.validEmail", locale),
    required: (locale: Locale) => t("errors.validation.required", locale),
    userNotFound: (locale: Locale) =>
      t("errors.validation.userNotFound", locale),
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
