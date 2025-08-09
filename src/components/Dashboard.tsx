'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, Subject, UserProgress } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DashboardProps {
  user: User
  profile: Profile | null
  subjects: Subject[]
  userProgress: UserProgress[]
}

export default function Dashboard({ user, profile, subjects, userProgress }: DashboardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const startQuiz = (subjectId: string) => {
    router.push(`/quiz/${subjectId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">IGCSE Quiz App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-yellow-500">⚡</div>
                <span className="font-semibold">{profile?.xp || 0} XP</span>
                <div className="text-purple-500">🏆</div>
                <span className="font-semibold">Level {profile?.level || 1}</span>
              </div>
              <button
                onClick={() => router.push('/guide')}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📖 Guide
              </button>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || user.email?.split('@')[0] || 'Student'}!
          </h2>
          <p className="text-gray-600 mb-4">Ready to boost your IGCSE knowledge?</p>
          
          {/* Quick Start Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-500 text-xl">💡</div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">New to the app?</h3>
                <p className="text-blue-700 text-sm mb-2">
                  Click on a subject below to start practicing! You earn XP for every question (even wrong answers), 
                  with bonus points for speed and accuracy.
                </p>
                <button
                  onClick={() => router.push('/guide')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                >
                  Read the complete guide →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <div className="w-6 h-6 text-blue-600">📊</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProgress.reduce((acc, progress) => acc + progress.total_questions_answered, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <div className="w-6 h-6 text-green-600">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userProgress.length > 0 
                    ? Math.round(
                        userProgress.reduce((acc, progress) => acc + progress.accuracy_percentage, 0) / userProgress.length
                      )
                    : 0
                  }%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <div className="w-6 h-6 text-orange-600">🔥</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.study_streak || 0} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose a Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const progress = userProgress.find(p => p.subject_id === subject.id)
              return (
                <div
                  key={subject.id}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => startQuiz(subject.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: subject.color || '#3B82F6' }}
                      >
                        {subject.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {subject.name}
                        </h4>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                      </div>
                    </div>
                    
                    {progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progress.accuracy_percentage.toFixed(1)}% accuracy</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress.accuracy_percentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {progress.total_questions_answered} questions completed
                        </p>
                      </div>
                    )}
                    
                    {!progress && (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm mb-2">Get started!</p>
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          New Subject
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 pb-6">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                      Start Quiz
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {userProgress.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Progress</h3>
            <div className="space-y-4">
              {userProgress.slice(0, 3).map((progress) => (
                <div key={progress.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: progress.subjects?.color || '#3B82F6' }}
                    >
                      {progress.subjects?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{progress.subjects?.name}</p>
                      <p className="text-sm text-gray-600">
                        {progress.total_questions_answered} questions • {progress.accuracy_percentage.toFixed(1)}% accuracy
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => startQuiz(progress.subject_id)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Continue →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}