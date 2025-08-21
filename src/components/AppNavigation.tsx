'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface AppNavigationProps {
  user: User
  profile: Profile | null
  title?: string
  showBackButton?: boolean
  backUrl?: string
}

export default function AppNavigation({ 
  user, 
  profile, 
  title,
  showBackButton = false,
  backUrl
}: AppNavigationProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const goBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  const navigationItems = [
    {
      path: '/',
      icon: 'ðŸ ',
      label: 'Dashboard',
      color: 'hover:text-blue-600'
    },
    {
      path: '/review',
      icon: 'ðŸ”',
      label: 'Review',
      color: 'hover:text-purple-600'
    },
    {
      path: '/history',
      icon: 'ðŸ“Š',
      label: 'History',
      color: 'hover:text-green-600'
    },
    {
      path: '/guide',
      icon: 'ðŸ“–',
      label: 'Guide',
      color: 'hover:text-indigo-600'
    }
  ]

  const isCurrentPath = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={goBack}
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
              >
                <span>â†</span>
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center">
              {!showBackButton && (
                <button
                  onClick={() => router.push('/')}
                  className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  IGCSE Quiz App
                </button>
              )}
              {title && showBackButton && (
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              )}
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isCurrent = isCurrentPath(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isCurrent 
                      ? 'bg-blue-50 text-blue-600' 
                      : `text-gray-600 ${item.color}`
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <select 
              value={pathname}
              onChange={(e) => router.push(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              {navigationItems.map((item) => (
                <option key={item.path} value={item.path}>
                  {item.icon} {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Progress */}
            <div className="flex items-center space-x-2">
              <div className="text-yellow-500">âš¡</div>
              <span className="font-semibold">{profile?.xp || 0} XP</span>
              <div className="text-purple-500">ðŸ†</div>
              <span className="font-semibold">Level {profile?.level || 1}</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden sm:block">
                {profile?.full_name || user.email?.split('@')[0] || 'User'}
              </span>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumbs for context */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => router.push('/')}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </button>
            {pathname !== '/' && (
              <>
                <span>â€º</span>
                <span className="text-gray-900 font-medium">
                  {pathname === '/review' && 'Answer Review'}
                  {pathname === '/history' && 'Quiz History'}
                  {pathname === '/guide' && 'User Guide'}
                  {pathname.startsWith('/quiz/') && 'Taking Quiz'}
                  {pathname.startsWith('/history/') && 'Session Review'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
