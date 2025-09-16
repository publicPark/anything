'use client'

import { useProfile } from '@/hooks/useProfile'
import { useI18n } from '@/hooks/useI18n'

export default function Home() {
  const { profile, loading } = useProfile()
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">{t('home.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            {profile ? t('home.welcome', { name: profile.display_name || profile.username }) : t('home.welcomeMessage')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('home.welcomeMessage')}
          </p>
          
          {profile ? (
            <div className="bg-muted rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t('home.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('home.description')}
              </p>
            </div>
          ) : (
            <div className="bg-muted rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t('home.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('home.description')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
