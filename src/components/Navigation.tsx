'use client'

import { useProfile } from '@/hooks/useProfile'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/hooks/useI18n'
import SettingsButton from '@/components/LanguageSwitcher'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const { profile, loading } = useProfile()
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => {
    const localizedPath = getLocalizedPath(path)
    
    // 홈 경로의 경우 특별 처리: /ko/와 /ko 모두 매칭
    if (path === '/') {
      return pathname === localizedPath || pathname === localizedPath.replace(/\/$/, '')
    }
    
    return pathname === localizedPath
  }
  
  const getLocalizedPath = (path: string) => {
    // During SSR or before mounting, use default locale
    if (!mounted) {
      return `/ko${path}`
    }
    return `/${locale}${path}`
  }

  // 서버사이드 렌더링 시 hydration mismatch 방지
  if (!mounted) {
    return (
      <nav className="bg-muted shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/ko" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground">
                  {t('navigation.home')}
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md text-muted-foreground">
                <div className="w-5 h-5"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-muted shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href={getLocalizedPath('/')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                }`}
              >
                {t('navigation.home')}
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* 설정 버튼 */}
            <SettingsButton />

            {profile && (
              <>
                <Link
                  href={getLocalizedPath('/profile')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/profile') 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background'
                  }`}
                  >
                    {t('navigation.profile')}
                  </Link>
                <Link
                  href={getLocalizedPath('/settings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/settings') 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background'
                  }`}
                  >
                    {t('navigation.settings')}
                  </Link>
              </>
            )}
            {!loading && !profile && (
              <Link
                href={getLocalizedPath('/login')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/login') 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                }`}
                >
                  {t('navigation.login')}
                </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
