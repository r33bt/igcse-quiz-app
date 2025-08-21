'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardDataService } from '@/lib/services/DashboardDataService'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { User } from '@supabase/supabase-js'

interface DetailedQuestion {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation?: string
  difficulty_level: number
  topic?: string
  subject_id: string
  created_at: string
  // Analysis fields
  timesAttempted: number
  timesCorrect: number
  accuracy: number
  lastAttempted?: string
  neverAttempted: boolean
}

interface QuizSession {
  id: string
  user_id: string
  total_questions: number
  correct_answers: number
  accuracy_percentage: number
  total_xp_earned: number
  completed_at: string
}

interface QuizAttempt {
  id: string
  user_id: string
  question_id: string
  quiz_session_id: string
  is_correct: boolean
  user_answer: string
  time_taken: number
  created_at: string
}

interface Subject {
  id: string
  name: string
  description?: string
}

interface EnhancedDiagnosticData {
  // Raw Database Data
  totalQuestionsInDB: number
  allQuestions: DetailedQuestion[]
  userSessions: QuizSession[]
  userAttempts: QuizAttempt[]
  subjects: Subject[]
  
  // Analysis Data
  attemptedQuestions: DetailedQuestion[]
  neverAttemptedQuestions: DetailedQuestion[]
  questionUsageStats: {
    mostUsed: DetailedQuestion[]
    leastUsed: DetailedQuestion[]
    perfectScore: DetailedQuestion[]
    strugglingWith: DetailedQuestion[]
  }
  
  // Service Calculations
  dashboardServiceStats: any
  quizSessionManagerStats: any
  
  // Consistency Checks
  consistencyChecks: {
    dashboardVsHistory: boolean
    calculationMatches: boolean
    dataIntegrity: boolean
    randomnessCheck: boolean
  }
}

export default function EnhancedDiagnostic() {
  const [data, setData] = useState<EnhancedDiagnosticData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'sessions' | 'analysis'>('overview')

  useEffect(() => {
    async function loadEnhancedData() {
      const supabase = createClient()
      const dashboardService = new DashboardDataService()
      const sessionManager = new QuizSessionManager()
      
      try {
        setLoading(true)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('No authenticated user found')
          return
        }
        setUser(user)

        console.log('🔍 Loading comprehensive diagnostic data...')

        // Fetch all raw data
        const [questionsResult, sessionsResult, attemptsResult, subjectsResult] = await Promise.all([
          supabase.from('questions').select('*').order('created_at', { ascending: true }),
          supabase.from('quiz_sessions').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }),
          supabase.from('quiz_attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('subjects').select('*')
        ])

        const allQuestions = questionsResult.data || []
        const userSessions = sessionsResult.data || []
        const userAttempts = attemptsResult.data || []
        const subjects = subjectsResult.data || []

        console.log('📊 Raw data loaded:', {
          questions: allQuestions.length,
          sessions: userSessions.length,
          attempts: userAttempts.length
        })

        // Analyze each question
        const detailedQuestions: DetailedQuestion[] = allQuestions.map(q => {
          const questionAttempts = userAttempts.filter(a => a.question_id === q.id)
          const correctAttempts = questionAttempts.filter(a => a.is_correct)
          
          return {
            ...q,
            timesAttempted: questionAttempts.length,
            timesCorrect: correctAttempts.length,
            accuracy: questionAttempts.length > 0 ? Math.round((correctAttempts.length / questionAttempts.length) * 100) : 0,
            lastAttempted: questionAttempts.length > 0 ? questionAttempts[0].created_at : undefined,
            neverAttempted: questionAttempts.length === 0
          }
        })

        // Categorize questions
        const attemptedQuestions = detailedQuestions.filter(q => !q.neverAttempted)
        const neverAttemptedQuestions = detailedQuestions.filter(q => q.neverAttempted)

        // Usage statistics
        const questionUsageStats = {
          mostUsed: attemptedQuestions.sort((a, b) => b.timesAttempted - a.timesAttempted).slice(0, 5),
          leastUsed: attemptedQuestions.sort((a, b) => a.timesAttempted - b.timesAttempted).slice(0, 5),
          perfectScore: attemptedQuestions.filter(q => q.accuracy === 100 && q.timesAttempted > 0),
          strugglingWith: attemptedQuestions.filter(q => q.accuracy < 50 && q.timesAttempted >= 2)
        }

        // Service calculations
        const dashboardStats = await dashboardService.getUserProgress(user.id)
        const sessionStats = await sessionManager.getUserQuizStats(user.id)

        // Enhanced consistency checks
        const uniqueQuestionIds = [...new Set(userAttempts.map(a => a.question_id))]
        const consistencyChecks = {
          dashboardVsHistory: dashboardStats.questionsAnswered === uniqueQuestionIds.length,
          calculationMatches: dashboardStats.questionAttempts === userAttempts.length,
          dataIntegrity: allQuestions.length >= uniqueQuestionIds.length,
          randomnessCheck: uniqueQuestionIds.length < (allQuestions.length * 0.5) // Less than 50% coverage suggests non-random
        }

        setData({
          totalQuestionsInDB: allQuestions.length,
          allQuestions: detailedQuestions,
          userSessions,
          userAttempts,
          subjects,
          attemptedQuestions,
          neverAttemptedQuestions,
          questionUsageStats,
          dashboardServiceStats: dashboardStats,
          quizSessionManagerStats: sessionStats,
          consistencyChecks
        })

        console.log('✅ Enhanced diagnostic data loaded successfully')

      } catch (err) {
        console.error('Error loading enhanced diagnostic data:', err)
        setError(`Failed to load data: ${err}`)
      } finally {
        setLoading(false)
      }
    }
    
    loadEnhancedData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enhanced diagnostic data...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing question usage patterns...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Diagnostic Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IGCSE Quiz App - Enhanced Diagnostic</h1>
              <p className="text-gray-600 mt-1">Comprehensive question analysis and system monitoring</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">User: {user?.email}</p>
              <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '🏥 System Health', count: '' },
              { id: 'questions', label: '📚 Question Analysis', count: `${data.attemptedQuestions.length}/${data.totalQuestionsInDB}` },
              { id: 'sessions', label: '🎯 Session Details', count: data.userSessions.length.toString() },
              { id: 'analysis', label: '🔍 Deep Analysis', count: '' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Health Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">🏥</span>
                System Health Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${data.consistencyChecks.dashboardVsHistory ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dashboard vs History</span>
                    <span className="text-2xl">{data.consistencyChecks.dashboardVsHistory ? '✅' : '❌'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.consistencyChecks.dashboardVsHistory ? 'Data consistent' : 'Calculation mismatch'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${data.consistencyChecks.calculationMatches ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Calculations</span>
                    <span className="text-2xl">{data.consistencyChecks.calculationMatches ? '✅' : '❌'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.consistencyChecks.calculationMatches ? 'Services match' : 'Calculation error'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${data.consistencyChecks.dataIntegrity ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Data Integrity</span>
                    <span className="text-2xl">{data.consistencyChecks.dataIntegrity ? '✅' : '❌'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.consistencyChecks.dataIntegrity ? 'Database consistent' : 'Data issue detected'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${!data.consistencyChecks.randomnessCheck ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Question Coverage</span>
                    <span className="text-2xl">{!data.consistencyChecks.randomnessCheck ? '✅' : '⚠️'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {!data.consistencyChecks.randomnessCheck ? 'Good distribution' : 'Low coverage detected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold text-blue-600">{data.totalQuestionsInDB}</p>
                  </div>
                  <span className="text-3xl">📚</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Questions Attempted</p>
                    <p className="text-2xl font-bold text-green-600">{data.attemptedQuestions.length}</p>
                  </div>
                  <span className="text-3xl">🎯</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Never Attempted</p>
                    <p className="text-2xl font-bold text-red-600">{data.neverAttemptedQuestions.length}</p>
                  </div>
                  <span className="text-3xl">❌</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Coverage Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((data.attemptedQuestions.length / data.totalQuestionsInDB) * 100)}%
                    </p>
                  </div>
                  <span className="text-3xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-8">
            {/* Question Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Attempted Questions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="text-xl mr-2">✅</span>
                  Questions You&apos;ve Attempted ({data.attemptedQuestions.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.attemptedQuestions.map((q, index) => (
                    <div key={q.id} className="p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-700">
                          Q{index + 1}: {q.question_text.substring(0, 60)}...
                        </div>
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Level {q.difficulty_level}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Attempted: {q.timesAttempted}x</span>
                        <span>Accuracy: {q.accuracy}%</span>
                        <span className={q.accuracy >= 70 ? 'text-green-600' : 'text-red-600'}>
                          {q.accuracy >= 70 ? '🟢' : '🔴'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Never Attempted Questions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="text-xl mr-2">❌</span>
                  Never Attempted Questions ({data.neverAttemptedQuestions.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.neverAttemptedQuestions.map((q, index) => (
                    <div key={q.id} className="p-3 bg-red-50 rounded border border-red-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-700">
                          Q{data.attemptedQuestions.length + index + 1}: {q.question_text.substring(0, 60)}...
                        </div>
                        <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Level {q.difficulty_level}
                        </div>
                      </div>
                      <div className="text-xs text-red-600">
                        🚫 This question has never appeared in your quizzes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quiz Generation Analysis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="text-xl mr-2">🎲</span>
                Quiz Generation Analysis
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">🔍 Key Finding</h4>
                <p className="text-yellow-700">
                  <strong>Quiz selects 8 random questions</strong> from {data.totalQuestionsInDB} available, but you&apos;ve only encountered {data.attemptedQuestions.length} unique questions. 
                  This suggests the randomization may not be working as expected, or there are filtering criteria limiting question selection.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">8</div>
                  <div className="text-sm text-gray-600">Questions per Quiz</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{data.totalQuestionsInDB}</div>
                  <div className="text-sm text-gray-600">Total Available</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{data.attemptedQuestions.length}</div>
                  <div className="text-sm text-gray-600">Actually Encountered</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="text-xl mr-2">📊</span>
                Recent Quiz Sessions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 border">Date</th>
                      <th className="text-left p-3 border">Session ID</th>
                      <th className="text-left p-3 border">Questions</th>
                      <th className="text-left p-3 border">Correct</th>
                      <th className="text-left p-3 border">Accuracy</th>
                      <th className="text-left p-3 border">XP</th>
                      <th className="text-left p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.userSessions.slice(0, 10).map((session, index) => {
                      const sessionAccuracy = Math.round(session.accuracy_percentage)
                      return (
                        <tr key={session.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-3 border text-xs">
                            {new Date(session.completed_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 border font-mono text-xs">
                            {session.id.substring(0, 8)}...
                          </td>
                          <td className="p-3 border text-center">{session.total_questions}</td>
                          <td className="p-3 border text-center">{session.correct_answers}</td>
                          <td className="p-3 border text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              sessionAccuracy >= 70 ? 'bg-green-100 text-green-800' :
                              sessionAccuracy >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sessionAccuracy}%
                            </span>
                          </td>
                          <td className="p-3 border text-center">{session.total_xp_earned}</td>
                          <td className="p-3 border">
                            <Link 
                              href={`/history/${session.id}`}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-8">
            {/* Usage Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Most Used Questions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="text-xl mr-2">🔥</span>
                  Most Frequently Used Questions
                </h3>
                <div className="space-y-2">
                  {data.questionUsageStats.mostUsed.map((q, index) => (
                    <div key={q.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <div className="text-sm text-gray-700">
                        Q{index + 1}: {q.question_text.substring(0, 40)}...
                      </div>
                      <div className="text-sm font-semibold text-orange-600">
                        {q.timesAttempted}x
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perfect Score Questions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="text-xl mr-2">🏆</span>
                  Perfect Score Questions
                </h3>
                <div className="space-y-2">
                  {data.questionUsageStats.perfectScore.length > 0 ? (
                    data.questionUsageStats.perfectScore.map((q, index) => (
                      <div key={q.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div className="text-sm text-gray-700">
                          Q{index + 1}: {q.question_text.substring(0, 40)}...
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          100% ({q.timesAttempted}x)
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No questions with 100% accuracy yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* IGCSE Syllabus Gap Analysis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="text-xl mr-2">📋</span>
                IGCSE 0580 Syllabus Analysis
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Next Steps Required</h4>
                <div className="text-blue-700 space-y-2">
                  <p>• <strong>Question Bank Expansion:</strong> Current {data.totalQuestionsInDB} questions need categorization into 9 IGCSE topics</p>
                  <p>• <strong>Topic Structure:</strong> Implement Number, Algebra, Geometry, Mensuration, Trigonometry, etc.</p>
                  <p>• <strong>Difficulty Mapping:</strong> Convert numeric levels to Easy/Medium/Hard labels</p>
                  <p>• <strong>Coverage Tracking:</strong> Monitor progress across all 66 IGCSE subtopics</p>
                  <p>• <strong>Random Selection Fix:</strong> Investigate why only {data.attemptedQuestions.length}/{data.totalQuestionsInDB} questions appear in quizzes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4 border-t">
          <p className="mt-1">
            <Link href="/" className="text-blue-600 hover:underline">← Back to Dashboard</Link> | 
            <Link href="/history" className="text-blue-600 hover:underline ml-2">View Quiz History</Link>
          </p>
        </div>
      </div>
    </div>
  )
}