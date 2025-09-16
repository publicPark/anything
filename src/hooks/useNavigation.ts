import { usePathname } from 'next/navigation'
import { useI18n } from '@/hooks/useI18n'
import { useState, useEffect } from 'react'

export function useNavigation() {
  const pathname = usePathname()
  const { locale } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getLocalizedPath = (path: string) => {
    // During SSR or before mounting, use default locale
    if (!mounted) {
      return `/ko${path}`
    }
    return `/${locale}${path}`
  }

  const isActive = (path: string) => {
    const localizedPath = getLocalizedPath(path)
    
    // 홈 경로의 경우 특별 처리: /ko/와 /ko 모두 매칭
    if (path === '/') {
      return pathname === localizedPath || pathname === localizedPath.replace(/\/$/, '')
    }
    
    return pathname === localizedPath
  }

  return {
    pathname,
    locale,
    mounted,
    getLocalizedPath,
    isActive
  }
}
