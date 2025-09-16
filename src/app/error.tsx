'use client'

import { useEffect } from 'react'
import { useI18n } from '@/hooks/useI18n'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { locale } = useI18n()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          {locale === 'en' ? 'Something went wrong!' : '문제가 발생했습니다!'}
        </h2>
        <p className="text-muted-foreground mb-8">
          {locale === 'en' 
            ? 'An unexpected error occurred. Please try again.' 
            : '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.'
          }
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover active:bg-primary-active focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        >
          {locale === 'en' ? 'Try again' : '다시 시도'}
        </button>
      </div>
    </div>
  )
}
