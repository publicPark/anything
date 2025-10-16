import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const preferredCookie = request.cookies.get("preferred_locale")?.value;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Redirect missing-locale paths to preferred or detected locale
  if (!pathnameHasLocale) {
    // Get locale from Accept-Language header or use default
    const acceptLanguage = request.headers.get("accept-language");
    let locale = defaultLocale;

    // If user has a preferred locale cookie, honor it first
    if (preferredCookie && locales.includes(preferredCookie as "ko" | "en")) {
      locale = preferredCookie as "ko" | "en";
    } else {
      if (acceptLanguage) {
        const preferredLocale = acceptLanguage
          .split(",")[0]
          .split("-")[0]
          .toLowerCase();

        if (locales.includes(preferredLocale as "ko" | "en")) {
          locale = preferredLocale as "ko" | "en";
        }
      }
    }

    // Always redirect to locale-prefixed path for consistency
    const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    // Ensure cookie is set for consistency (1 year)
    if (locale) {
      response.cookies.set("preferred_locale", locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  // If a locale is present but differs from preferred, normalize to preferred
  if (
    pathnameHasLocale &&
    preferredCookie &&
    locales.includes(preferredCookie as "ko" | "en")
  ) {
    const currentLocale = pathname.split("/")[1] as "ko" | "en";
    if (currentLocale !== preferredCookie) {
      const pathWithoutCurrent = pathname.replace(/^\/[a-z]{2}/, "") || "/";
      const redirectUrl = new URL(
        `/${preferredCookie}${pathWithoutCurrent}`,
        request.url
      );
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set("preferred_locale", preferredCookie, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }
  }

  // If URL contains a locale but it differs from preferred, keep browsing
  // However, when navigating with bare paths later, cookie will re-apply preference

  // Handle Supabase authentication
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
