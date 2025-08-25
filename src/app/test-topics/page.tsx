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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation title="Test Topic Selector" showBackButton={true} backUrl="/" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Quiz Topic Selector Test
          </h1>
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
