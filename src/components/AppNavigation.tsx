'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface AppNavigationProps {
  title?: string
  showBackButton?: boolean
  backUrl?: string
}

export default function AppNavigation({
  title,
  showBackButton = false,
  backUrl
}: AppNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  const goBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  const navItems = [
    {
      path: '/',
      icon: '🏠',
      label: 'Dashboard',
      color: 'hover:text-blue-600'
    },
    {
      path: '/test-topics',
      icon: '🧪',
      label: 'Test Topics',
      color: 'hover:text-cyan-600',
      isDev: true
    },
    {
      path: '/review',
      icon: '📝',
      label: 'Review',
      color: 'hover:text-purple-600'
    },
    {
      path: '/history',
      icon: '📊',
      label: 'History',
      color: 'hover:text-green-600'
    },
    {
      path: '/grades',
      icon: '🎯',
      label: 'Grades',
      color: 'hover:text-orange-600'
    },
    {
      path: '/guide',
      icon: '📖',
      label: 'Guide',
      color: 'hover:text-indigo-600'
    }
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <button
                  onClick={goBack}
                  className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
                >
                  <span>←</span>
                  <span>Back</span>
                </button>
              )}
              {title && showBackButton && (
                <div className="h-6 w-px bg-gray-300"></div>
              )}
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-semibold text-lg"
              >
                Dashboard
              </Link>
              {pathname !== '/' && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-900 font-medium">
                    {pathname === '/guide' && 'User Guide'}
                    {pathname === '/grades' && 'IGCSE Grading System'}
                    {pathname === '/test-topics' && 'Enhanced Topic Selector (Dev)'}
                    {pathname.startsWith('/quiz/') && 'Taking Quiz'}
                    {pathname.startsWith('/history/') && 'Session Review'}
                    {pathname === '/diagnostic' && 'System Diagnostic'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  pathname === item.path
                    ? 'bg-gray-100 text-gray-900'
                    : `text-gray-600 ${item.color}`
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
                {item.isDev && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs px-1 rounded-full leading-tight">
                    DEV
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
