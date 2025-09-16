import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 공개적으로 접근 가능한 경로들 (로케일 프리픽스 포함)
  const publicPaths = ['/login', '/auth', '/', '/settings']
  const pathname = request.nextUrl.pathname
  
  // 로케일 프리픽스 제거하여 경로 확인
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
  
  if (
    !user &&
    !publicPaths.some(path => pathWithoutLocale.startsWith(path))
  ) {
    // 로그인이 필요한 페이지에 접근 시 로그인 페이지로 리다이렉트
    const url = request.nextUrl.clone()
    // 현재 로케일 유지
    const locale = pathname.split('/')[1] || 'ko'
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // 사용자가 로그인되어 있고 프로필이 필요한 페이지에 접근하는 경우 프로필 확인
  if (
    user &&
    !publicPaths.some(path => pathWithoutLocale.startsWith(path)) &&
    !pathWithoutLocale.startsWith('/profile')
  ) {
    // 프로필 존재 여부 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    // 프로필이 없으면 프로필 페이지로 리다이렉트
    if (!profile) {
      const url = request.nextUrl.clone()
      // 현재 로케일 유지
      const locale = pathname.split('/')[1] || 'ko'
      url.pathname = `/${locale}/profile`
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}
