import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase 인증 미들웨어
 * - 인증 상태 확인
 * - 공개 경로 접근 제어
 * - 로그인 필요 시 리다이렉트
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 현재 사용자 인증 상태 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 공개적으로 접근 가능한 경로들
  const publicPaths = ["/login", "/auth", "/", "/ship"];
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  // 로그인 페이지에 이미 인증된 사용자가 접근하는 경우
  if (user && pathWithoutLocale.startsWith("/login")) {
    const locale = pathname.split("/")[1];
    const redirectUrl = new URL(`/${locale}/`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 로그인이 필요한 페이지에 비인증 사용자가 접근하는 경우
  if (
    !user &&
    !publicPaths.some((path) => pathWithoutLocale.startsWith(path))
  ) {
    const url = request.nextUrl.clone();
    const locale = pathname.split("/")[1] || "ko";
    url.pathname = `/${locale}/login`;

    // 원래 페이지를 next 파라미터로 추가
    url.searchParams.set("next", pathname);

    const response = NextResponse.redirect(url);

    // returnTo 쿠키도 설정 (추가 보안)
    response.cookies.set("returnTo", pathname, {
      maxAge: 60 * 10, // 10분
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  }

  return supabaseResponse;
}
