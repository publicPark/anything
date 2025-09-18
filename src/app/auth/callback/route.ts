import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Get returnTo value from cookie
 */
async function getReturnToFromCookie(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies.returnTo || null;
}

/**
 * Authentication callback handler
 * Handles OAuth callbacks and magic link authentication
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  // next 파라미터 우선, 없으면 쿠키에서 가져오기, 둘 다 없으면 홈으로
  const next =
    searchParams.get("next") ??
    (await getReturnToFromCookie(request)) ??
    "/ko/";

  // Handle authentication errors
  if (error) {
    return redirectToErrorPage(origin, {
      error,
      errorCode,
      errorDescription,
      next,
    });
  }

  // Handle authentication code exchange
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (!exchangeError) {
      return redirectToSuccess(origin, next, request);
    } else {
      console.error("Auth exchange error:", exchangeError);
      return redirectToErrorPage(origin, {
        error: "exchange_error",
        errorCode: exchangeError.message,
        errorDescription: exchangeError.message,
        next,
      });
    }
  }

  // No code and no error - invalid request
  return redirectToErrorPage(origin, {
    error: "missing_code",
    errorDescription: "No authentication code provided",
    next,
  });
}

/**
 * Redirect to success page with proper host handling
 */
function redirectToSuccess(origin: string, next: string, request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  let response: NextResponse;

  if (isLocalEnv) {
    response = NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost) {
    response = NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    response = NextResponse.redirect(`${origin}${next}`);
  }

  // returnTo 쿠키 삭제
  response.cookies.delete("returnTo");

  return response;
}

/**
 * Redirect to error page with error details
 */
function redirectToErrorPage(
  origin: string,
  params: {
    error: string;
    errorCode?: string | null;
    errorDescription?: string | null;
    next?: string | null;
  }
) {
  const errorUrl = new URL("/auth/auth-code-error", origin);

  errorUrl.searchParams.set("error", params.error);
  if (params.errorCode)
    errorUrl.searchParams.set("error_code", params.errorCode);
  if (params.errorDescription)
    errorUrl.searchParams.set("error_description", params.errorDescription);
  if (params.next) errorUrl.searchParams.set("next", params.next);

  return NextResponse.redirect(errorUrl.toString());
}
