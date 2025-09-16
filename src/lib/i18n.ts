import ko from '@/locales/ko.json'
import en from '@/locales/en.json'

export type Locale = 'ko' | 'en'

export const locales: Locale[] = ['ko', 'en']
export const defaultLocale: Locale = 'ko'

export const translations = {
  ko,
  en,
} as const

export type TranslationKeys = typeof ko

export function getTranslations(locale: Locale) {
  return translations[locale]
}

export function t(key: string, locale: Locale, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: unknown = translations[locale]
  
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k]
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation key "${key}" not found for locale "${locale}"`)
    return key
  }
  
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match
    })
  }
  
  return value
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/')
  const firstSegment = segments[1]
  
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale
  }
  
  return defaultLocale
}

export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/')
  const firstSegment = segments[1]
  
  if (locales.includes(firstSegment as Locale)) {
    return '/' + segments.slice(2).join('/') || '/'
  }
  
  return pathname
}
