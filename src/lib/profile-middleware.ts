import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function ensureProfile(userId: string) {
  const supabase = await createClient()
  
  // 프로필 존재 여부 확인
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // 프로필이 없는 경우 자동 생성
    const { data: user } = await supabase.auth.getUser()
    
    if (user.user) {
      const username = `user_${userId.substring(0, 8)}`
      const displayName = user.user.email?.split('@')[0] || 'User'

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username,
          display_name: displayName,
          role: 'basic'
        })

      if (insertError) {
        console.error('프로필 생성 오류:', insertError)
        return null
      }

      // 프로필 생성 후 프로필 페이지로 리다이렉트
      redirect('/profile')
    }
  }

  return profile
}
