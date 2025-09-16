'use client'

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/hooks/useI18n'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    display_name: ''
  })
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { t, locale } = useI18n()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">{t('profile.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive">{t('profile.error')}: {error}</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4 text-muted-foreground">{t('profile.notFound')}</div>
          <Button onClick={() => window.location.reload()}>
            {t('profile.refresh')}
          </Button>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    setFormData({
      display_name: profile.display_name || ''
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      await updateProfile(formData)
      setIsEditing(false)
      setMessage(t('profile.updateSuccess'))
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage(t('profile.updateError'))
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      display_name: profile.display_name || ''
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}/`)
  }

  const getRoleDisplayName = (role: string) => {
    return t(`profile.roles.${role}`)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'basic': return 'bg-muted text-foreground'
      case 'premium': return 'bg-info-100 text-info-800'
      case 'admin': return 'bg-destructive/10 text-destructive'
      default: return 'bg-muted text-foreground'
    }
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-muted rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t('profile.title')}</h1>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            message.includes('업데이트') || message.includes('updated') ? 'bg-success-100 text-success-800' : 'bg-destructive/10 text-destructive'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('profile.displayName')}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ display_name: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                placeholder={t('profile.displayNamePlaceholder')}
              />
            ) : (
              <div className="px-3 py-2 bg-input border border-border rounded-md text-muted-foreground">
                {profile.display_name || <span className="text-muted-foreground">{t('profile.notSet')}</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('profile.userCode')}
            </label>
            <div className="text-muted-foreground font-mono text-sm bg-input px-2 py-1 rounded border-l-4 border-border">
              {profile.username}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('profile.role')}
            </label>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(profile.role)}`}>
              {getRoleDisplayName(profile.role)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('profile.joinDate')}
            </label>
            <div className="text-muted-foreground text-sm">
              {formatDate(profile.created_at)}
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex-1">
                {t('profile.save')}
              </Button>
              <Button variant="secondary" onClick={handleCancel} className="flex-1">
                {t('profile.cancel')}
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="flex-1">
              {t('profile.edit')}
            </Button>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            {t('profile.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}
