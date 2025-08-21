import { ReactNode } from "react"
import Link from "next/link"

interface PageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  showBackLink?: boolean
  backUrl?: string
  userEmail?: string
}

export function PageLayout({ 
  title, 
  subtitle, 
  children, 
  showBackLink = true,
  backUrl = "/",
  userEmail 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {userEmail && (
              <div className="text-right">
                <p className="text-sm text-gray-500">User: {userEmail}</p>
                <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>

      {/* Footer */}
      {showBackLink && (
        <div className="text-center text-gray-500 text-sm py-4 border-t bg-white">
          <p className="mt-1">
            <Link href={backUrl} className="text-blue-600 hover:underline">← Back to Dashboard</Link>
          </p>
        </div>
      )}
    </div>
  )
}
