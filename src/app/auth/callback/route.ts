import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
  const next = searchParams.get("next") ?? "/ko/";

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

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  } else {
    return NextResponse.redirect(`${origin}${next}`);
  }
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
