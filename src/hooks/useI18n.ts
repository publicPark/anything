'use client'

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, t, Locale } from '@/lib/i18n'
import { useMemo, useCallback } from 'react'

export function useI18n() {
  const pathname = usePathname()
  
  // Detect locale from pathname - works consistently in both SSR and client
  const locale = useMemo(() => {
    return getLocaleFromPathname(pathname)
  }, [pathname])
  
  // translate 함수를 useCallback으로 메모이제이션하여 불필요한 재생성 방지
  const translate = useCallback((key: string, params?: Record<string, string | number>) => {
    return t(key, locale, params)
  }, [locale])
  
  return {
    locale,
    t: translate,
  }
}
