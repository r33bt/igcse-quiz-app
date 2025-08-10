'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, QuizSession } from '@/lib/types'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { useRouter } from 'next/navigation'

interface QuizHistoryProps {
  user: User
  profile: Profile | null
}

export default function QuizHistory({ user }: Omit<QuizHistoryProps, 'profile'>) {
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
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterAccuracy, setFilterAccuracy] = useState<string>('all')
  const [topicAnalysis, setTopicAnalysis] = useState<{[key: string]: {correct: number, total: number, accuracy: number}}>({}) 
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const router = useRouter()
  const sessionManager = useMemo(() => new QuizSessionManager(), [])

  const loadQuizHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load quiz sessions
      const sessions = await sessionManager.getUserQuizHistory(user.id)
      setQuizSessions(sessions)

      // Load stats
      const userStats = await sessionManager.getUserQuizStats(user.id)
      setStats(userStats)

      // Calculate topic analysis
      const analysis: {[key: string]: {correct: number, total: number, accuracy: number}} = {}
      sessions.forEach(session => {
        // Mock topic extraction - in real app you'd get this from quiz attempts
        const topic = session.subjects?.name || 'General'
        if (!analysis[topic]) {
          analysis[topic] = { correct: 0, total: 0, accuracy: 0 }
        }
        analysis[topic].correct += session.correct_answers
        analysis[topic].total += session.total_questions
        analysis[topic].accuracy = Math.round((analysis[topic].correct / analysis[topic].total) * 100)
      })
      setTopicAnalysis(analysis)

    } catch (err) {
      console.error('Error loading quiz history:', err)
      setError('Failed to load quiz history. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user.id, sessionManager])

  useEffect(() => {
    loadQuizHistory()
  }, [loadQuizHistory])


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

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500'
    if (accuracy >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTopicStrength = (accuracy: number) => {
    if (accuracy >= 80) return { label: 'Strong', color: 'text-green-600' }
    if (accuracy >= 60) return { label: 'Good', color: 'text-yellow-600' }
    return { label: 'Needs Work', color: 'text-red-600' }
  }

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const filteredSessions = quizSessions.filter(session => {
    if (filterSubject !== 'all' && session.subjects?.name !== filterSubject) return false
    if (filterAccuracy === 'high' && session.accuracy_percentage < 80) return false
    if (filterAccuracy === 'medium' && (session.accuracy_percentage < 60 || session.accuracy_percentage >= 80)) return false
    if (filterAccuracy === 'low' && session.accuracy_percentage >= 60) return false
    return true
  })

  const uniqueSubjects = Array.from(new Set(quizSessions.map(s => s.subjects?.name).filter(Boolean)))

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

      {/* Topic Strength Analysis */}
      {Object.keys(topicAnalysis).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Topic Performance Analysis</h2>
            <p className="text-gray-600 mt-1">See how you&apos;re performing across different topics</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(topicAnalysis).map(([topic, data]) => {
                const strength = getTopicStrength(data.accuracy)
                return (
                  <div key={topic} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{topic}</h3>
                      <span className={`text-sm font-medium ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{data.correct}/{data.total} correct</span>
                      <span className={`font-bold ${strength.color}`}>{data.accuracy}%</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getAccuracyBadgeColor(data.accuracy)}`} 
                        style={{ width: `${Math.min(data.accuracy, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quiz History */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quiz History</h2>
              <p className="text-gray-600 mt-1">Click on any session to review all questions and answers</p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
              <select 
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              <select 
                value={filterAccuracy}
                onChange={(e) => setFilterAccuracy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Performance</option>
                <option value="high">High (80%+)</option>
                <option value="medium">Medium (60-79%)</option>
                <option value="low">Needs Improvement (&lt;60%)</option>
              </select>
            </div>
          </div>
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
            {filteredSessions.map((session) => {
              const isExpanded = expandedSessions.has(session.id)
              const timeTaken = session.session_duration ? Math.round(session.session_duration / 60) : null
              
              return (
                <div key={session.id} className="bg-white">
                  {/* Session Header */}
                  <div className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: session.subjects?.color || '#3B82F6' }}
                          >
                            {session.subjects?.name?.charAt(0) || 'Q'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {session.subjects?.name || 'Quiz'} Session
                              </h3>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getAccuracyColor(session.accuracy_percentage)}`}>
                                {Math.round(session.accuracy_percentage)}%
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>{formatDate(session.completed_at!)}</span>
                              {timeTaken && <span>• {timeTaken} min</span>}
                              <span>• {session.total_questions} questions</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {session.correct_answers}/{session.total_questions}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xl font-bold text-yellow-600">
                            {session.total_xp_earned}
                          </div>
                          <div className="text-xs text-gray-500">XP</div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSessionExpansion(session.id)
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                          >
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </button>
                          <button
                            onClick={() => router.push(`/history/${session.id}`)}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            Full Review
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Quick Stats */}
                    {isExpanded && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="text-2xl text-green-600 mr-3">✓</div>
                              <div>
                                <div className="text-lg font-bold text-green-700">{session.correct_answers}</div>
                                <div className="text-sm text-green-600">Correct Answers</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="text-2xl text-red-600 mr-3">✗</div>
                              <div>
                                <div className="text-lg font-bold text-red-700">{session.total_questions - session.correct_answers}</div>
                                <div className="text-sm text-red-600">Incorrect Answers</div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="text-2xl text-blue-600 mr-3">⚡</div>
                              <div>
                                <div className="text-lg font-bold text-blue-700">{session.total_xp_earned}</div>
                                <div className="text-sm text-blue-600">XP Earned</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => router.push(`/history/${session.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                          >
                            📖 Review All {session.total_questions} Questions & Answers
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredSessions.length === 0 && quizSessions.length > 0 && (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters to see more quiz sessions.</p>
                <button
                  onClick={() => {
                    setFilterSubject('all')
                    setFilterAccuracy('all')
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
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