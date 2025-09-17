import { URL_PATTERNS, LOCALE_CONSTANTS } from "./constants";

/**
 * URL helper functions
 */

/**
 * Get the current origin URL
 */
export function getOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/**
 * Build authentication callback URL
 */
export function buildAuthCallbackUrl(locale: string, next?: string): string {
  const origin = getOrigin();
  const nextPath = next || `/${locale}${URL_PATTERNS.HOME}`;
  return `${origin}${URL_PATTERNS.AUTH_CALLBACK}?next=${encodeURIComponent(
    nextPath
  )}`;
}

/**
 * Build localized path
 */
export function buildLocalizedPath(
  path: string,
  locale: string = LOCALE_CONSTANTS.DEFAULT
): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/${locale}/${cleanPath}`;
}

/**
 * Build redirect URL for OAuth
 */
export function buildOAuthRedirectUrl(locale: string, next?: string): string {
  return buildAuthCallbackUrl(locale, next);
}
