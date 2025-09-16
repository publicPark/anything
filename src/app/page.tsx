'use client'

import { useProfile } from '@/hooks/useProfile'
import Link from 'next/link'

export default function Home() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            {profile && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  안녕하세요, {profile.display_name || profile.username}님!
                </h1>
                <p className="text-lg text-gray-600">환영합니다!</p>
              </div>
            )}
            {!profile && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  NextJS + Supabase 인증 시스템
                </h1>
                <p className="text-lg text-gray-600">매직링크/구글 로그인과 프로필 관리가 가능한 웹사이트입니다.</p>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
