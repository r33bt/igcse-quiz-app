'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { QuizSession, QuizAttempt } from '@/lib/types'
import { useRouter } from 'next/navigation'

type SessionReviewData = {
  session: QuizSession | null
  attempts: QuizAttempt[]
}

interface SessionReviewProps {
  user: User
  sessionId: string
}

export default function SessionReview({ user, sessionId }: SessionReviewProps) {
  const [sessionData, setSessionData] = useState<SessionReviewData>({ 
    session: null, 
    attempts: [] 
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const sessionManager = useMemo(() => new QuizSessionManager(), [])

  const loadSessionReview = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const reviewData = await sessionManager.getSessionReview(sessionId)

      if (!reviewData.session) {
        setError('Quiz session not found')
        return
      }

      if (reviewData.session.user_id !== user.id) {
        setError('Access denied - this quiz session does not belong to you')
        return
      }

      setSessionData({
        session: reviewData.session as QuizSession,
        attempts: (reviewData.attempts || []) as QuizAttempt[]
      })

    } catch (err) {
      console.error('Error loading session review:', err)
      setError('Failed to load quiz session. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sessionId, sessionManager, user.id])

  useEffect(() => {
    loadSessionReview()
  }, [loadSessionReview])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
  }

  const formatTime = (seconds: number | null | undefined): string => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const safeNumber = (value: number | null | undefined): number => {
    return typeof value === 'number' ? value : 0
  }

  const safeString = (value: string | null | undefined): string => {
    return typeof value === 'string' ? value : ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quiz review...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !sessionData.session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/history')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Back to History
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { session, attempts } = sessionData

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz Session Review</h1>
            {session?.completed_at && (
              <p className="text-gray-600">Completed on {formatDate(session.completed_at)}</p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 space-x-3">
            <button
              onClick={() => router.push('/history')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              ← History
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {safeNumber(session?.correct_answers)}/{safeNumber(session?.total_questions)}
              </div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                safeNumber(session?.accuracy_percentage) >= 80 ? 'text-green-600' :
                safeNumber(session?.accuracy_percentage) >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(safeNumber(session?.accuracy_percentage))}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{safeNumber(session?.total_xp_earned)}</div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {attempts?.reduce((sum, attempt) => sum + safeNumber(attempt?.time_taken), 0) || 0}s
              </div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{safeString(session?.session_type)}</div>
              <div className="text-sm text-gray-600">Quiz Mode</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Attempts</h2>
          {!attempts || attempts.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No question attempts found for this session.</p>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt, index) => (
                <div key={attempt?.id || index} className={`p-4 rounded-lg border-2 transition-colors ${
                  attempt?.is_correct ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-red-50 border-red-200 hover:bg-red-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        attempt?.is_correct ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <span className={`text-lg font-bold ${
                          attempt?.is_correct ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {attempt?.is_correct ? '✅ Correct' : '❌ Incorrect'}
                        </span>
                        <div className="text-sm text-gray-600">
                          General Mathematics • Level {safeNumber(attempt?.difficulty_at_time) || 1}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">+{safeNumber(attempt?.xp_earned)} XP</div>
                      <div className="text-sm text-gray-600">Time: {formatTime(attempt?.time_taken)}</div>
                    </div>
                  </div>
                  
                  {attempt?.user_answer && (
                    <div className="mt-3 text-sm text-gray-700 bg-white bg-opacity-50 rounded p-2">
                      <span className="font-medium">Your answer:</span> {attempt.user_answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <button
            onClick={() => router.push('/history')}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
          >
            📚 View All Quiz History
          </button>
          <button
            onClick={() => router.push('/mathematics')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
          >
            🎯 Take Another Quiz
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
