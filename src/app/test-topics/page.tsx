"use client"

import { useState } from 'react'
import QuizTopicSelector from '@/components/QuizTopicSelector'
import AppNavigation from '@/components/AppNavigation'

export default function TestTopicSelector() {
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
