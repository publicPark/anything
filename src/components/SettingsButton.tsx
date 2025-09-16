'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useI18n } from '@/hooks/useI18n'

export default function SettingsButton() {
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useI18n()
  
  const goToSettings = () => {
    router.push(`/${locale}/settings`)
  }
  
  const isActive = () => {
    return pathname === `/${locale}/settings`
  }

  return (
    <button
      onClick={goToSettings}
      className={`p-2 rounded-md transition-all duration-200 cursor-pointer border border-transparent ${
        isActive()
          ? 'bg-primary text-primary-foreground shadow-md border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-background hover:border-border'
      }`}
      title={locale === 'en' ? 'Settings' : '설정'}
      aria-label={locale === 'en' ? 'Settings' : '설정'}
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
        />
      </svg>
    </button>
  )
}
