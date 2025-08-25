"use client"
import { useEffect } from 'react'
import QuizTopicSelector from '@/components/QuizTopicSelector'
import AppNavigation from '@/components/AppNavigation'

export default function TestTopicSelector() {
  // Handle auto-expansion of completed subtopic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const expandedSubtopicId = urlParams.get('expanded')
    const justCompleted = urlParams.get('completed')
    
    if (expandedSubtopicId && justCompleted) {
      // Auto-expand the subtopic that was just completed
      // This depends on your current subtopic expansion implementation
      // You may need to add state management for expanded subtopics
      console.log('Auto-expanding subtopic:', expandedSubtopicId)
      
      // Clear URL parameters after handling
      window.history.replaceState({}, '', '/test-topics')
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
        </div>
        <QuizTopicSelector />
      </main>
    </div>
  )
}
