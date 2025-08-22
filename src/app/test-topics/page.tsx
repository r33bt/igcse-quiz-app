"use client"

import { useState } from 'react'
import QuizTopicSelector from '@/components/QuizTopicSelector'
import AppNavigation from '@/components/AppNavigation'

export default function TestTopicSelector() {
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('')

  const handleTopicSelect = (topicId: string, subtopicId?: string) => {
    setSelectedTopic(topicId)
    setSelectedSubtopic(subtopicId || '')
    console.log('Selected:', { topicId, subtopicId })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation title="Test Topic Selector" showBackButton={true} backUrl="/" />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Quiz Topic Selector Test
          </h1>
          
          {selectedTopic && (
            <div className="bg-white rounded-lg p-4 mb-6 border">
              <p className="text-sm text-gray-600">Selected:</p>
              <p className="font-medium">Topic ID: {selectedTopic}</p>
              {selectedSubtopic && <p className="font-medium">Subtopic ID: {selectedSubtopic}</p>}
            </div>
          )}
        </div>

        <QuizTopicSelector onTopicSelect={handleTopicSelect} />
      </main>
    </div>
  )
}
