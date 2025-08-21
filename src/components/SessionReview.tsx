'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { QuizSession, QuizAttempt, Question } from '@/lib/types'
import { useRouter } from 'next/navigation'

type EnhancedAttempt = QuizAttempt & {
  question?: Question
}

type SessionReviewData = {
  session: QuizSession | null
  attempts: EnhancedAttempt[]
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

      // Get session and attempts data
      const reviewData = await sessionManager.getSessionReview(sessionId)

      if (!reviewData.session) {
        setError('Quiz session not found')
        return
      }

      if (reviewData.session.user_id !== user.id) {
        setError('Access denied - this quiz session does not belong to you')
        return
      }

      // Fetch complete question details for each attempt
      const attemptsWithQuestions = await Promise.all(
        (reviewData.attempts || []).map(async (attempt) => {
          try {
            const { data: questionData } = await sessionManager.supabase
              .from('questions')
              .select('*')
              .eq('id', attempt.question_id)
              .single()
            
            return {
              ...attempt,
              question: questionData
            }
          } catch (err) {
            console.error('Error fetching question details:', err)
            return attempt
          }
        })
      )

      setSessionData({
        session: reviewData.session as QuizSession,
        attempts: attemptsWithQuestions as EnhancedAttempt[]
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

  const renderQuestionOptions = (question: Question, userAnswer: string | null, isCorrect: boolean) => {
    if (!question.options || !Array.isArray(question.options)) {
      return null
    }

    const options = ['A', 'B', 'C', 'D']
    
    return (
      <div className="mt-4 space-y-3">
        {question.options.map((option, index) => {
          const optionLetter = options[index]
          const isUserAnswer = userAnswer === optionLetter || userAnswer === option
          const isCorrectAnswer = question.correct_answer === optionLetter || question.correct_answer === option
          
          let optionClass = 'p-3 rounded-lg border-2 transition-all duration-200 '
          
          if (isCorrectAnswer) {
            optionClass += 'bg-green-100 border-green-300 text-green-800 '
          } else if (isUserAnswer && !isCorrect) {
            optionClass += 'bg-red-100 border-red-300 text-red-800 '
          } else {
            optionClass += 'bg-gray-50 border-gray-200 text-gray-700 '
          }

          return (
            <div key={index} className={optionClass}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-lg">{optionLetter})</span>
                  <span className="text-base">{option}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isCorrectAnswer && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      ✓ Correct
                    </span>
                  )}
                  {isUserAnswer && !isCorrect && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Your Answer
                    </span>
                  )}
                  {isUserAnswer && isCorrect && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      ✓ Your Answer
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading detailed quiz review...</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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

        {/* Session Summary */}
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

        {/* Detailed Question Review */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Detailed Question Review</h2>
          
          {!attempts || attempts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-600">No question attempts found for this session.</p>
            </div>
          ) : (
            attempts.map((attempt, index) => (
              <div key={attempt?.id || index} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Question Header */}
                <div className={`p-4 ${
                  attempt?.is_correct 
                    ? 'bg-green-50 border-b border-green-200' 
                    : 'bg-red-50 border-b border-red-200'
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
                          Level {safeNumber(attempt?.difficulty_at_time) || 1} • {formatTime(attempt?.time_taken)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">+{safeNumber(attempt?.xp_earned)} XP</div>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="p-6">
                  {attempt?.question?.question_text && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {attempt.question.question_text}
                      </h3>
                      
                      {/* Answer Options */}
                      {renderQuestionOptions(attempt.question, attempt.user_answer, attempt.is_correct)}
                    </div>
                  )}

                  {/* Explanation */}
                  {attempt?.question?.explanation && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-500 text-white rounded-full p-1 mt-0.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            {attempt.question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 text-center space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
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
