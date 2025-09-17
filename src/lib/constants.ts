/**
 * Application constants
 */

// URL patterns
export const URL_PATTERNS = {
  AUTH_CALLBACK: "/auth/callback",
  HOME: "/",
  LOGIN: "/login",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

// Locale constants
export const LOCALE_CONSTANTS = {
  DEFAULT: "ko" as const,
  SUPPORTED: ["ko", "en"] as const,
} as const;

// Error codes
export const ERROR_CODES = {
  PROFILE_NOT_FOUND: "PGRST116",
  USERNAME_CONFLICT: "23505",
} as const;

// UI constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  MESSAGE_TIMEOUT: 3000,
  ANIMATION_DURATION: 200,
} as const;

// Date formatting
export const DATE_FORMAT = {
  LOCALE: "ko-KR",
  OPTIONS: {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
} as const;
