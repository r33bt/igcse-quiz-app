'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, QuizSession, QuizAttempt } from '@/lib/types'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { useRouter } from 'next/navigation'

interface SessionReviewProps {
  user: User
  profile: Profile | null
  sessionId: string
}

export default function SessionReview({ user, sessionId }: Omit<SessionReviewProps, 'profile'>) {
  const [session, setSession] = useState<QuizSession | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const sessionManager = useMemo(() => new QuizSessionManager(), [])

  const loadSessionReview = useCallback(async () => {
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

      setSession(reviewData.session)
      setAttempts(reviewData.attempts)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
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

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
            <button
              onClick={() => router.push('/history')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium mr-4"
            >
              Back to History
            </button>
            <button
              onClick={loadSessionReview}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Quiz Session Review</h1>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {session.correct_answers}/{session.total_questions}
              </div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                session.accuracy_percentage >= 80 ? 'text-green-600' :
                session.accuracy_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(session.accuracy_percentage)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{session.total_xp_earned}</div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{session.session_type}</div>
              <div className="text-sm text-gray-600">Mode</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {formatDate(session.completed_at!)}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        {/* Attempts Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Question Attempts</h2>
          {attempts.length === 0 ? (
            <p className="text-gray-600">No question attempts found for this session.</p>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt, index) => (
                <div key={attempt.id} className={`p-4 rounded-lg border-2 ${
                  attempt.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        attempt.is_correct ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <span className={`font-medium ${
                          attempt.is_correct ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {attempt.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                        <div className="text-sm text-gray-600">
                          General • Level {attempt.difficulty_at_time || 1}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        Time: {formatTime(attempt.time_taken)}
                      </span>
                      <span className="text-yellow-600 font-medium">
                        +{attempt.xp_earned} XP
                      </span>
                    </div>
                  </div>
                  {attempt.user_answer && (
                    <div className="mt-2 text-sm text-gray-600">
                      Your answer: <span className="font-medium">{attempt.user_answer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="text-center space-x-4">
          <button
            onClick={() => router.push('/history')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to History
          </button>
          <button
            onClick={() => router.push('/mathematics')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
