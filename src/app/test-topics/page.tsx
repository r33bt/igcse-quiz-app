"use client"
import { useEffect, useState } from 'react'
import QuizTopicSelector from '@/components/QuizTopicSelector'
import AppNavigation from '@/components/AppNavigation'

export default function TestTopicSelector() {
  const [completionMessage, setCompletionMessage] = useState<string>('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const expandedId = urlParams.get('expanded')
    const completed = urlParams.get('completed')
    const focus = urlParams.get('focus')
    const path = urlParams.get('path')
    
    if (expandedId && completed) {
      console.log('Auto-expanding subtopic:', expandedId)
      
      // Create completion message
      let message = `${completed} quiz completed! `
      if (focus && focus !== 'mixed') message += `${focus} focus • `
      if (path) message += `${path} paper`
      setCompletionMessage(message)
      
      // Clear URL parameters after 5 seconds
      setTimeout(() => {
        window.history.replaceState({}, '', '/test-topics')
        setCompletionMessage('')
      }, 5000)
    }
  }, [])

  const handleLogout = () => {
    // Simple redirect to login - no Supabase calls that might hang localhost
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quiz Topic Selector Test</h1>
              <p className="text-sm text-gray-600">Test Environment</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          {completionMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 font-medium">
              🎉 {completionMessage}
            </div>
          )}
        </div>
        <QuizTopicSelector />
      </main>
    </div>
  )
}
