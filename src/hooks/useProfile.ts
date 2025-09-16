'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setProfile(null)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // 프로필이 없는 경우 자동 생성
            const newProfile = await createProfile(user.id, user.email || '')
            setProfile(newProfile)
          } else {
            setError(error.message)
          }
        } else {
          setProfile(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    getProfile()

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const createProfile = async (userId: string, email: string): Promise<Profile> => {
    const username = `user_${userId.substring(0, 8)}`
    const displayName = email.split('@')[0]

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        display_name: displayName,
        role: 'basic'
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    setProfile(data)
    return data
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile
  }
}
