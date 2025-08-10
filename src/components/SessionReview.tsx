'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, QuizSession, QuizAttempt, Question } from '@/lib/types'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { useRouter } from 'next/navigation'

interface SessionReviewProps {
  user: User
  profile: Profile | null
  sessionId: string
}

export default function SessionReview({ user, sessionId }: Omit<SessionReviewProps, 'profile'>) {
  const [session, setSession] = useState<QuizSession | null>(null)
  const [attempts, setAttempts] = useState<(QuizAttempt & { questions: Question })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const sessionManager = useMemo(() => new QuizSessionManager(), [])

  const loadSessionReview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get session details
      const reviewData = await sessionManager.getSessionReview(sessionId)
      
      if (!reviewData.session) {
        setError('Quiz session not found')
        return
      }

      // Check if this session belongs to the current user
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/history')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to History
              </button>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                  style={{ backgroundColor: session.subjects?.color || '#3B82F6' }}
                >
                  {session.subjects?.name?.charAt(0) || 'Q'}
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  {session.subjects?.name || 'Quiz'} Review
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
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

        {/* Questions Review */}
        <div className="space-y-6">
          {attempts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-600">No question attempts found for this session.</p>
            </div>
          ) : (
            attempts.map((attempt, index) => (
              <div key={attempt.id} className="bg-white rounded-xl shadow-sm border">
                {/* Question Header */}
                <div className={`p-4 border-b ${
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
                          {attempt.questions.topic || 'General'} • Level {attempt.questions.difficulty_level}
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
                </div>

                {/* Question Content */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {attempt.questions.question_text}
                  </h3>

                  {/* Answer Options */}
                  <div className="space-y-2 mb-6">
                    {Array.isArray(attempt.questions.options) && attempt.questions.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg border-2 ${
                          option === attempt.questions.correct_answer
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : option === attempt.user_answer && option !== attempt.questions.correct_answer
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3 text-xs font-bold">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{option}</span>
                          {option === attempt.questions.correct_answer && (
                            <span className="ml-auto text-green-600 font-medium">✓ Correct</span>
                          )}
                          {option === attempt.user_answer && option !== attempt.questions.correct_answer && (
                            <span className="ml-auto text-red-600 font-medium">✗ Your Answer</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  {attempt.questions.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
                      <p className="text-blue-800 text-sm">{attempt.questions.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => router.push('/history')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to History
          </button>
          <button
            onClick={() => router.push(`/quiz/${session.subject_id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  )
}