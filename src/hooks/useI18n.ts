'use client'

import { usePathname } from 'next/navigation'
import { getLocaleFromPathname, t, Locale, defaultLocale } from '@/lib/i18n'
import { useState, useEffect } from 'react'

export function useI18n() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  
  useEffect(() => {
    setMounted(true)
    setLocale(getLocaleFromPathname(pathname))
  }, [pathname])
  
  const translate = (key: string, params?: Record<string, string | number>) => {
    return t(key, locale, params)
  }
  
  // Return default locale during SSR to prevent hydration mismatch
  if (!mounted) {
    return {
      locale: defaultLocale,
      t: (key: string, params?: Record<string, string | number>) => t(key, defaultLocale, params),
    }
  }
  
  return {
    locale,
    t: translate,
  }
}
