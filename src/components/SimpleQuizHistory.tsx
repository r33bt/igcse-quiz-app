'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SimpleQuizHistoryProps {
  user: User
  profile: Profile | null
}

export default function SimpleQuizHistory({ user, profile }: SimpleQuizHistoryProps) {
  const [quizData, setQuizData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalCorrect: 0,
    averageAccuracy: 0,
    totalXP: 0,
    recentQuizzes: 0
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadQuizHistory()
  }, [user.id])

  const loadQuizHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get quiz attempts with question and subject info (grouped by day)
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          questions:questions(
            *,
            subjects:subjects(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (attemptsError) {
        throw attemptsError
      }

      // Group attempts by date and subject
      const groupedData = []
      const dateGroups: Record<string, any> = {}

      attempts?.forEach(attempt => {
        const date = new Date(attempt.created_at).toDateString()
        const subjectName = attempt.questions?.subjects?.name || 'Unknown Subject'
        const key = `${date}-${subjectName}`

        if (!dateGroups[key]) {
          dateGroups[key] = {
            date,
            subject: attempt.questions?.subjects,
            attempts: [],
            totalQuestions: 0,
            correctAnswers: 0,
            totalXP: 0
          }
        }

        dateGroups[key].attempts.push(attempt)
        dateGroups[key].totalQuestions++
        if (attempt.is_correct) dateGroups[key].correctAnswers++
        dateGroups[key].totalXP += attempt.xp_earned || 0
      })

      // Convert to array and sort by date
      const sortedGroups = Object.values(dateGroups).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      setQuizData(sortedGroups)

      // Calculate overall stats
      const totalQuestions = attempts?.length || 0
      const totalCorrect = attempts?.filter(a => a.is_correct).length || 0
      const totalXP = attempts?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0
      const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
      const recentQuizzes = sortedGroups.length

      setStats({
        totalQuestions,
        totalCorrect,
        averageAccuracy,
        totalXP,
        recentQuizzes
      })

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

    if (diffDays === 0) {
      return 'Today'
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.recentQuizzes}</div>
          <div className="text-sm text-gray-600">Quiz Sessions</div>
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
          <div className="text-2xl font-bold text-indigo-600">{stats.totalCorrect}</div>
          <div className="text-sm text-gray-600">Correct Answers</div>
        </div>
      </div>

      {/* Quiz History */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Recent Quiz Activity</h2>
          <p className="text-gray-600 mt-1">Your quiz history grouped by date and subject</p>
        </div>

        {quizData.length === 0 ? (
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
            {quizData.map((group: any, index) => {
              const accuracy = Math.round((group.correctAnswers / group.totalQuestions) * 100)
              
              return (
                <div key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: group.subject?.color || '#3B82F6' }}
                        >
                          {group.subject?.name?.charAt(0) || 'Q'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {group.subject?.name || 'Quiz'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(group.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {group.correctAnswers}/{group.totalQuestions}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-semibold px-2 py-1 rounded-full ${getAccuracyColor(accuracy)}`}>
                          {accuracy}%
                        </div>
                        <div className="text-xs text-gray-500">Accuracy</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-yellow-600">
                          {group.totalXP}
                        </div>
                        <div className="text-xs text-gray-500">XP</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show question details on expand */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {group.attempts.slice(0, 6).map((attempt: any, i: number) => (
                      <div 
                        key={i} 
                        className={`text-xs px-2 py-1 rounded ${
                          attempt.is_correct 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {attempt.is_correct ? '✅' : '❌'} +{attempt.xp_earned || 0} XP
                      </div>
                    ))}
                    {group.attempts.length > 6 && (
                      <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        +{group.attempts.length - 6} more questions
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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