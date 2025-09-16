import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale as 'ko' | 'en')) {
    notFound()
  }

  return (
    <>
      {children}
    </>
  )
}

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }))
}
