'use client'

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, t, Locale } from '@/lib/i18n'
import { useMemo } from 'react'

export function useI18n() {
  const pathname = usePathname()
  
  // Detect locale from pathname - works consistently in both SSR and client
  const locale = useMemo(() => {
    return getLocaleFromPathname(pathname)
  }, [pathname])
  
  const translate = (key: string, params?: Record<string, string | number>) => {
    return t(key, locale, params)
  }
  
  return {
    locale,
    t: translate,
  }
}
