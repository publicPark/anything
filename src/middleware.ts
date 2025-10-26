import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, Locale } from "@/lib/i18n";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const preferredCookie = request.cookies.get("preferred_locale")?.value;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Redirect missing-locale paths to preferred or default locale
  if (!pathnameHasLocale) {
    // Use preferred cookie or default locale
    const locale = locales.includes(preferredCookie as Locale) 
      ? preferredCookie as Locale 
      : defaultLocale;

    const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cookie for consistency
    response.cookies.set("preferred_locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    
    return response;
  }

  // Handle Supabase authentication
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all request paths except static files, API routes, and auth routes
    "/((?!_next/static|_next/image|favicon.ico|auth/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
