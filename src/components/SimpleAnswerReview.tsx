'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface QuizAttempt {
  id: string
  is_correct: boolean
  xp_earned: number
  time_taken: number
  user_answer: string
  created_at: string
  question?: {
    id: string
    question_text: string
    correct_answer: string
    options: string | string[]
    explanation?: string
    topic?: string
    difficulty_level: number
    subjects?: {
      name: string
      color: string
    }
  }
}

interface SimpleAnswerReviewProps {
  user: User
  profile: Profile | null
  subjectId?: string
  limit?: number
}

export default function SimpleAnswerReview({ 
  user, 
  subjectId, 
  limit = 20 
}: Omit<SimpleAnswerReviewProps, 'profile'>) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const loadRecentAttempts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // First, get quiz attempts (simple query)
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (attemptsError) {
        throw attemptsError
      }

      // Then, fetch questions for each attempt separately (SAME AS SessionReview)
      const attemptsWithQuestions = await Promise.all(
        (attemptsData || []).map(async (attempt) => {
          try {
            const { data: questionData } = await supabase
              .from('questions')
              .select('*')
              .eq('id', attempt.question_id)
              .single()
            
            // Also fetch subject data separately
const { data: subjectData } = await supabase
  .from('subjects')
  .select('*')
  .eq('id', questionData?.subject_id)
  .single()

return {
  ...attempt,
  question: {
    ...questionData,
    subjects: subjectData
  }
}
          } catch (err) {
            console.error('Error fetching question:', err)
            return attempt
          }
        })
      )

      console.log('Attempts data:', attemptsWithQuestions); setAttempts(attemptsWithQuestions)

    } catch (err) {
      console.error('Error loading attempts:', err)
      setError('Failed to load quiz attempts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user.id, subjectId, limit, supabase])

  useEffect(() => {
    loadRecentAttempts()
  }, [loadRecentAttempts])

  const toggleExpansion = (attemptId: string) => {
    setExpandedAttempt(expandedAttempt === attemptId ? null : attemptId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getTimeColor = (timeTaken: number) => {
    if (timeTaken <= 10) return 'text-green-600'
    if (timeTaken <= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your quiz attempts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadRecentAttempts}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¤ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz Attempts Yet</h3>
        <p className="text-gray-600 mb-6">Start taking quizzes to review your answers here!</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Take a Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Answer Review</h3>
        <p className="text-sm text-gray-600">{attempts.length} recent attempts</p>
      </div>

      <div className="space-y-3">
        {attempts.map((attempt) => {
          const isExpanded = expandedAttempt === attempt.id
          const question = attempt.question
          const subject = question?.subjects
          
          // Parse options safely
          let options = []
          if (question?.options) {
            try {
              options = typeof question.options === 'string' 
                ? JSON.parse(question.options) 
                : question.options
            } catch {
              options = []
            }
          }

          return (
            <div 
              key={attempt.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleExpansion(attempt.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: subject?.color || '#3B82F6' }}
                      >
                        {subject?.name?.charAt(0) || 'Q'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {subject?.name || 'Unknown Subject'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(attempt.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {question?.question_text || 'Question not found'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 ml-4">
                    <div className={`text-2xl ${
                      attempt.is_correct ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {attempt.is_correct ? 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦' : 'ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢'}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-600">
                        +{attempt.xp_earned || 0} XP
                      </p>
                      <p className={`text-xs ${getTimeColor(attempt.time_taken || 0)}`}>
                        {attempt.time_taken || 0}s
                      </p>
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¼' : 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¶'}
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4">
                  <div className="space-y-4">
                    {/* Question Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                      <p className="text-gray-700">{question?.question_text}</p>
                      {question?.topic && (
                        <p className="text-xs text-gray-500 mt-1">Topic: {question.topic}</p>
                      )}
                    </div>

                    {/* Answer Options */}
                    {options.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Answer Options:</h4>
                        <div className="space-y-2">
                          {options.map((option: string, index: number) => {
                            const isCorrectAnswer = option === question?.correct_answer
                            const isUserAnswer = option === attempt.user_answer
                            
                            let className = 'p-2 rounded-lg text-sm border-2 '
                            if (isCorrectAnswer) {
                              className += 'border-green-500 bg-green-50 text-green-700'
                            } else if (isUserAnswer && !isCorrectAnswer) {
                              className += 'border-red-500 bg-red-50 text-red-700'
                            } else {
                              className += 'border-gray-200 bg-gray-50 text-gray-700'
                            }

                            return (
                              <div key={index} className={className}>
                                <div className="flex items-center justify-between">
                                  <span>{option}</span>
                                  <div className="flex items-center space-x-2">
                                    {isUserAnswer && (
                                      <span className="text-xs font-medium">
                                        Your Answer
                                      </span>
                                    )}
                                    {isCorrectAnswer && (
                                      <span className="text-xs font-medium text-green-600">
                                        Correct ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {question?.explanation && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-700">{question.explanation}</p>
                        </div>
                      </div>
                    )}

                    {/* Performance Stats */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Performance:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {attempt.time_taken || 0}s
                          </p>
                          <p className="text-xs text-gray-600">Time Taken</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-yellow-600">
                            {attempt.xp_earned || 0}
                          </p>
                          <p className="text-xs text-gray-600">XP Earned</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-blue-600">
                            Level {question?.difficulty_level || 1}
                          </p>
                          <p className="text-xs text-gray-600">Difficulty</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className={`text-lg font-bold ${attempt.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                            {attempt.is_correct ? 'PASS' : 'FAIL'}
                          </p>
                          <p className="text-xs text-gray-600">Result</p>
                        </div>
                      </div>
                    </div>

                    {/* Learning Suggestion */}
                    {!attempt.is_correct && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-700">
                          ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â¡ <strong>Learning Tip:</strong> Review the correct answer and explanation above. 
                          Consider practicing more questions on the topic &quot;{question?.topic || 'this subject'}&quot; 
                          to strengthen your understanding.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 pt-6">
        <button
          onClick={() => router.push('/history')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          View Full History
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Take Another Quiz
        </button>
      </div>
    </div>
  )
}











