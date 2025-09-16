'use client'

import { useI18n } from '@/hooks/useI18n'
import { useRouter, usePathname } from 'next/navigation'
import { locales } from '@/lib/i18n'
import { useTheme } from '@/contexts/ThemeContext'

export default function SettingsPage() {
  const { locale } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  

  const getLanguageDisplay = (lang: string) => {
    switch (lang) {
      case 'ko': return '한국어'
      case 'en': return 'English'
      default: return lang.toUpperCase()
    }
  }

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'ko': return '🇰🇷'
      case 'en': return '🇺🇸'
      default: return '🌐'
    }
  }

  const switchLanguage = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
    const newPath = `/${newLocale}${pathWithoutLocale}`
    
    // Ensure the path is valid
    if (newPath === `/${newLocale}` || newPath === `/${newLocale}/`) {
      router.push(`/${newLocale}`)
    } else {
      router.push(newPath)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          {locale === 'en' ? 'Settings' : '설정'}
        </h1>
        
        <div className="space-y-6">
          {/* Language Settings Card */}
          <div className="bg-muted rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {locale === 'en' ? 'Language' : '언어'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {locale === 'en' 
                ? 'Choose your preferred language' 
                : '선호하는 언어를 선택하세요'
              }
            </p>

            <div className="space-y-3">
              {locales.map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    locale === lang
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : 'bg-input border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getLanguageFlag(lang)}</span>
                    <span className="font-medium">{getLanguageDisplay(lang)}</span>
                  </div>
                  {locale === lang && (
                    <span className="text-primary">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Appearance Settings Card */}
          <div className="bg-muted rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {locale === 'en' ? 'Appearance' : '외관'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {locale === 'en' 
                ? 'Choose your preferred theme' 
                : '선호하는 테마를 선택하세요'
              }
            </p>

            <div className="space-y-3">
              <button
                onClick={() => theme !== 'light' ? toggleTheme() : null}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  theme === 'light'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-input border-border text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">☀️</span>
                  <span className="font-medium">{locale === 'en' ? 'Light Mode' : '라이트 모드'}</span>
                </div>
                {theme === 'light' && (
                  <span className="text-primary">
                    ✓
                  </span>
                )}
              </button>

              <button
                onClick={() => theme !== 'dark' ? toggleTheme() : null}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-input border-border text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🌙</span>
                  <span className="font-medium">{locale === 'en' ? 'Dark Mode' : '다크 모드'}</span>
                </div>
                {theme === 'dark' && (
                  <span className="text-primary">
                    ✓
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Go Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="bg-secondary text-secondary-foreground py-2 px-6 rounded-md hover:bg-secondary-hover active:bg-secondary-active transition-colors"
          >
            {locale === 'en' ? 'Go Back' : '돌아가기'}
          </button>
        </div>
      </div>
    </div>
  )
}
