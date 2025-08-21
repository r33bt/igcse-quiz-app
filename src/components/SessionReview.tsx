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
  const [attempts, setAttempts] = useState<(QuizAttempt & { questions?: any })[]>([])
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Navigation */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quiz Session Review</h1>
            <p className="text-gray-600">Completed on {formatDate(session.completed_at!)}</p>
          </div>
          <div className="space-x-3">
            <button
              onClick={() => router.push('/history')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              ← Back to History
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {session.correct_answers}/{session.total_questions}
              </div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                session.accuracy_percentage >= 80 ? 'text-green-600' :
                session.accuracy_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(session.accuracy_percentage)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{session.total_xp_earned}</div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0)}s
              </div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{session.session_type}</div>
              <div className="text-sm text-gray-600">Quiz Mode</div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Question by Question Review</h2>
          {attempts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-600">No question attempts found for this session.</p>
            </div>
          ) : (
            attempts.map((attempt, index) => {
              const question = attempt.questions || {}
              const options = question.options || []
              const userAnswer = attempt.user_answer
              const correctAnswer = question.correct_answer

              return (
                <div key={attempt.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  {/* Question Header */}
                  <div className={`p-4 border-b ${
                    attempt.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          attempt.is_correct ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <span className={`text-lg font-bold ${
                            attempt.is_correct ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {attempt.is_correct ? '✅ Correct' : '❌ Incorrect'}
                          </span>
                          <div className="text-sm text-gray-600">
                            General • Level {attempt.difficulty_at_time || 1}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-600">+{attempt.xp_earned} XP</div>
                        <div className="text-sm text-gray-600">Time: {formatTime(attempt.time_taken)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      {question.question_text || `Question ${index + 1}`}
                    </h3>

                    {/* Answer Options */}
                    {options.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {options.map((option: string, optionIndex: number) => {
                          const optionLetter = String.fromCharCode(65 + optionIndex)
                          const isCorrect = optionLetter === correctAnswer
                          const isUserChoice = optionLetter === userAnswer
                          
                          let className = "p-4 rounded-lg border-2 "
                          if (isCorrect && isUserChoice) {
                            className += "bg-green-100 border-green-500 text-green-900"
                          } else if (isCorrect) {
                            className += "bg-green-50 border-green-300 text-green-800"
                          } else if (isUserChoice) {
                            className += "bg-red-100 border-red-500 text-red-900"
                          } else {
                            className += "bg-gray-50 border-gray-200 text-gray-700"
                          }

                          return (
                            <div key={optionIndex} className={className}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-4 text-sm font-bold">
                                    {optionLetter}
                                  </span>
                                  <span className="text-lg">{option}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {isCorrect && <span className="text-green-600 font-bold">✓ Correct Answer</span>}
                                  {isUserChoice && !isCorrect && <span className="text-red-600 font-bold">✗ Your Choice</span>}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">
                          <strong>Your Answer:</strong> {userAnswer || 'No answer recorded'}
                        </p>
                        {correctAnswer && (
                          <p className="text-green-700 mt-2">
                            <strong>Correct Answer:</strong> {correctAnswer}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-bold text-blue-900 mb-2">💡 Explanation</h4>
                        <p className="text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-12 text-center space-x-4">
          <button
            onClick={() => router.push('/history')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
          >
            📚 View All Quiz History
          </button>
          <button
            onClick={() => router.push('/mathematics')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
          >
            🎯 Take Another Quiz
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

