'use client'

import { useProfile } from '@/hooks/useProfile'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const { profile, loading } = useProfile()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                홈
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {profile && (
              <Link
                href="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                프로필
              </Link>
            )}
            {!loading && !profile && (
              <Link
                href="/login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/login') 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
