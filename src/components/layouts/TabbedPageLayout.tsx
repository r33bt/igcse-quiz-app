import { ReactNode } from "react"

interface Tab {
  id: string
  label: string
  count?: string | number
  icon?: string
}

interface TabbedPageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  userEmail?: string
}

export function TabbedPageLayout({
  title,
  subtitle, 
  children,
  tabs,
  activeTab,
  onTabChange,
  userEmail
}: TabbedPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
                {tab.count && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
