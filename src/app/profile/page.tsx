'use client'

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    display_name: ''
  })
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-error-600">오류: {error}</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">프로필을 찾을 수 없습니다.</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            새로고침
          </button>
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
      setMessage('프로필이 업데이트되었습니다.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('업데이트 중 오류가 발생했습니다.')
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
    router.push('/')
  }


  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'basic': return '기본 사용자'
      case 'premium': return '프리미엄 사용자'
      case 'admin': return '관리자'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'basic': return 'bg-gray-100 text-gray-800'
      case 'premium': return 'bg-info-100 text-info-800'
      case 'admin': return 'bg-error-100 text-error-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            message.includes('업데이트') ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              표시 이름
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ display_name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="표시할 이름을 입력하세요"
              />
            ) : (
              <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-600">
                {profile.display_name || <span className="text-neutral-500">설정되지 않음</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              유저 코드
            </label>
            <div className="text-neutral-600 font-mono text-sm bg-neutral-50 px-2 py-1 rounded border-l-4 border-neutral-300">
              {profile.username}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              권한
            </label>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(profile.role)}`}>
              {getRoleDisplayName(profile.role)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              가입일
            </label>
            <div className="text-neutral-600 text-sm">
              {new Date(profile.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-neutral-300 text-neutral-700 py-2 px-4 rounded-md hover:bg-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              >
                취소
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              수정
            </button>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full bg-error-600 text-white py-2 px-4 rounded-md hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-error-500"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
