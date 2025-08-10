'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, QuizSession } from '@/lib/types'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { useRouter } from 'next/navigation'

interface QuizHistoryProps {
  user: User
  profile: Profile | null
}

export default function QuizHistory({ user, profile }: QuizHistoryProps) {
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    averageAccuracy: 0,
    totalXP: 0,
    recentStreakDays: 0
  })

  const router = useRouter()
  const sessionManager = new QuizSessionManager()

  useEffect(() => {
    loadQuizHistory()
  }, [user.id])

  const loadQuizHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load quiz sessions
      const sessions = await sessionManager.getUserQuizHistory(user.id)
      setQuizSessions(sessions)

      // Load stats
      const userStats = await sessionManager.getUserQuizStats(user.id)
      setStats(userStats)

    } catch (err) {
      console.error('Error loading quiz history:', err)
      setError('Failed to load quiz history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffDays === 0) {
      if (diffHours === 0) {
        return 'Just now'
      }
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600 bg-green-50'
    if (accuracy >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your quiz history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadQuizHistory}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalQuizzes}</div>
          <div className="text-sm text-gray-600">Total Quizzes</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalQuestions}</div>
          <div className="text-sm text-gray-600">Questions Answered</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.averageAccuracy}%</div>
          <div className="text-sm text-gray-600">Average Accuracy</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.totalXP}</div>
          <div className="text-sm text-gray-600">Total XP</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.recentStreakDays}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.totalCorrect}</div>
          <div className="text-sm text-gray-600">Correct Answers</div>
        </div>
      </div>

      {/* Quiz History */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Recent Quizzes</h2>
          <p className="text-gray-600 mt-1">Click on any quiz to review your answers</p>
        </div>

        {quizSessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz History Yet</h3>
            <p className="text-gray-600 mb-6">Start taking quizzes to see your progress here!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Take Your First Quiz
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {quizSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => router.push(`/history/${session.id}`)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: session.subjects?.color || '#3B82F6' }}
                      >
                        {session.subjects?.name?.charAt(0) || 'Q'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {session.subjects?.name || 'Quiz'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.completed_at!)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {session.correct_answers}/{session.total_questions}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-semibold px-2 py-1 rounded-full ${getAccuracyColor(session.accuracy_percentage)}`}>
                        {Math.round(session.accuracy_percentage)}%
                      </div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">
                        {session.total_xp_earned}
                      </div>
                      <div className="text-xs text-gray-500">XP</div>
                    </div>
                    
                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
        >
          Take Another Quiz
        </button>
      </div>
    </div>
  )
}