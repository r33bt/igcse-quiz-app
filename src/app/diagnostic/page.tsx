'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardDataService } from '@/lib/services/DashboardDataService'
import { QuizSessionManager } from '@/lib/quiz-sessions'

interface DiagnosticData {
  // Database Raw Data
  totalQuestionsInDB: number
  questionIds: string[]
  userSessions: any[]
  userAttempts: any[]
  
  // Service Calculations
  dashboardServiceStats: any
  quizSessionManagerStats: any
  
  // Derived Metrics
  uniqueQuestionsAttempted: number
  uniqueQuestionIds: string[]
  totalAttemptCount: number
  
  // Consistency Checks
  consistencyChecks: {
    dashboardVsHistory: boolean
    calculationMatches: boolean
    dataIntegrity: boolean
  }
}

export default function ComprehensiveDiagnostic() {
  const [data, setData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadComprehensiveData() {
      const supabase = createClient()
      const dashboardService = new DashboardDataService()
      const sessionManager = new QuizSessionManager()
      
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('No authenticated user found')
          return
        }
        setUser(user)

        // 1. RAW DATABASE DATA
        console.log('🔍 Fetching raw database data...')
        
        const [questionsResult, sessionsResult, attemptsResult, profileResult] = await Promise.all([
          supabase.from('questions').select('*'),
          supabase.from('quiz_sessions').select('*').eq('user_id', user.id),
          supabase.from('quiz_attempts').select('*').eq('user_id', user.id),
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        ])

        // 2. SERVICE CALCULATIONS
        console.log('📊 Running service calculations...')
        
        const dashboardStats = await dashboardService.getUserProgress(user.id)
        const sessionStats = await sessionManager.getUserQuizStats(user.id)
        
        // 3. DERIVED METRICS
        const uniqueQuestionIds = [...new Set(attemptsResult.data?.map(a => a.question_id) || [])]
        
        // 4. CONSISTENCY CHECKS
        const consistencyChecks = {
          dashboardVsHistory: dashboardStats.questionsAnswered === uniqueQuestionIds.length,
          calculationMatches: dashboardStats.questionAttempts === (attemptsResult.data?.length || 0),
          dataIntegrity: (questionsResult.data?.length || 0) >= uniqueQuestionIds.length
        }

        setData({
          totalQuestionsInDB: questionsResult.data?.length || 0,
          questionIds: questionsResult.data?.map(q => q.id) || [],
          userSessions: sessionsResult.data || [],
          userAttempts: attemptsResult.data || [],
          dashboardServiceStats: dashboardStats,
          quizSessionManagerStats: sessionStats,
          uniqueQuestionsAttempted: uniqueQuestionIds.length,
          uniqueQuestionIds,
          totalAttemptCount: attemptsResult.data?.length || 0,
          consistencyChecks
        })

      } catch (err) {
        console.error('Error loading diagnostic data:', err)
        setError(`Failed to load data: ${err}`)
      } finally {
        setLoading(false)
      }
    }
    
    loadComprehensiveData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comprehensive diagnostic data...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">IGCSE Quiz App - Comprehensive Diagnostic</h1>
              <p className="text-gray-600 mt-1">Complete system analysis and data monitoring dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">User: {user?.email}</p>
              <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* System Health Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="text-2xl mr-2">🏥</span>
            System Health Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${data.consistencyChecks.dashboardVsHistory ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Dashboard vs History</span>
                <span className="text-2xl">{data.consistencyChecks.dashboardVsHistory ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.consistencyChecks.dashboardVsHistory ? 'Data consistent' : 'Calculation mismatch detected'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${data.consistencyChecks.calculationMatches ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Attempt Calculations</span>
                <span className="text-2xl">{data.consistencyChecks.calculationMatches ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.consistencyChecks.calculationMatches ? 'Calculations match' : 'Service calculation error'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${data.consistencyChecks.dataIntegrity ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Data Integrity</span>
                <span className="text-2xl">{data.consistencyChecks.dataIntegrity ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {data.consistencyChecks.dataIntegrity ? 'Database consistent' : 'Data integrity issue'}
              </p>
            </div>
          </div>
        </div>

        {/* Core Database Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Questions Database */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-xl mr-2">📚</span>
              Questions Database
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                src/lib/supabase
              </span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Total Questions Available:</span>
                <span className="text-xl font-bold text-blue-600">{data.totalQuestionsInDB}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium mb-2">Question IDs in Database:</div>
                <div className="text-sm font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  {data.questionIds.join(', ')}
                </div>
              </div>
              <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded">
                💡 <strong>Source:</strong> Direct query from 'questions' table<br/>
                📍 <strong>Used by:</strong> Quiz generation, question selection logic
              </div>
            </div>
          </div>

          {/* User Quiz Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-xl mr-2">🎯</span>
              Your Quiz Activity
              <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Live Data
              </span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Total Quiz Sessions:</span>
                <span className="text-xl font-bold text-green-600">{data.userSessions.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Total Question Attempts:</span>
                <span className="text-xl font-bold text-orange-600">{data.totalAttemptCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Unique Questions Attempted:</span>
                <span className="text-xl font-bold text-purple-600">{data.uniqueQuestionsAttempted}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="font-medium mb-2">Question IDs You've Attempted:</div>
                <div className="text-sm font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  {data.uniqueQuestionIds.join(', ') || 'None'}
                </div>
              </div>
              <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
                💡 <strong>Sources:</strong> quiz_sessions + quiz_attempts tables<br/>
                📍 <strong>Used by:</strong> Progress tracking, statistics calculation
              </div>
            </div>
          </div>
        </div>

        {/* Service Comparison */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="text-xl mr-2">⚖️</span>
            Service Calculation Comparison
            <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Critical Analysis
            </span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dashboard Service */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                📊 DashboardDataService
                <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">
                  src/lib/services/DashboardDataService.ts
                </span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Questions Answered:</span>
                  <span className="font-mono font-bold">{data.dashboardServiceStats.questionsAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span>Question Attempts:</span>
                  <span className="font-mono font-bold">{data.dashboardServiceStats.questionAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quizzes Completed:</span>
                  <span className="font-mono font-bold">{data.dashboardServiceStats.quizzesCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answer Accuracy:</span>
                  <span className="font-mono font-bold">{data.dashboardServiceStats.answerAccuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>XP Earned:</span>
                  <span className="font-mono font-bold">{data.dashboardServiceStats.xpEarned}</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                <strong>Logic:</strong> uniqueQuestions = [...new Set(attempts.map(a {'=>'}  a.question_id))]<br/>
                <strong>Used by:</strong> Dashboard.tsx, QuizHistory.tsx (new)
              </div>
            </div>

            {/* Quiz Session Manager */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                📈 QuizSessionManager
                <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded">
                  src/lib/quiz-sessions.ts
                </span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Quizzes:</span>
                  <span className="font-mono font-bold">{data.quizSessionManagerStats.totalQuizzes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-mono font-bold">{data.quizSessionManagerStats.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Correct:</span>
                  <span className="font-mono font-bold">{data.quizSessionManagerStats.totalCorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Accuracy:</span>
                  <span className="font-mono font-bold">{data.quizSessionManagerStats.averageAccuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total XP:</span>
                  <span className="font-mono font-bold">{data.quizSessionManagerStats.totalXP}</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                <strong>Logic:</strong> sessions.reduce((sum, s) {'=>'}  sum + s.total_questions)<br/>
                <strong>Used by:</strong> QuizHistory.tsx (original)
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">📋 Analysis</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Key Difference:</strong> DashboardDataService counts <em>unique questions attempted</em> ({data.dashboardServiceStats.questionsAnswered}), 
                while QuizSessionManager counts <em>total questions across all sessions</em> ({data.quizSessionManagerStats.totalQuestions}).
              </p>
              <p>
                <strong>Current Status:</strong> Both Dashboard and Quiz History now use DashboardDataService for consistency.
              </p>
              <p className={data.consistencyChecks.dashboardVsHistory ? 'text-green-700' : 'text-red-700'}>
                <strong>Consistency Check:</strong> {data.consistencyChecks.dashboardVsHistory ? '✅ PASSED' : '❌ FAILED'} - 
                {data.consistencyChecks.dashboardVsHistory 
                  ? ' Both components show identical calculations' 
                  : ' Components still showing different values'}
              </p>
            </div>
          </div>
        </div>

        {/* Data Flow Visualization */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="text-xl mr-2">🔄</span>
            Data Flow Architecture
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
            <div className="text-blue-600 font-semibold">DATABASE TABLES:</div>
            <div className="ml-4 text-gray-700">
              ├── questions ({data.totalQuestionsInDB} total) → Quiz content<br/>
              ├── quiz_sessions ({data.userSessions.length} user sessions) → Session metadata<br/>
              └── quiz_attempts ({data.totalAttemptCount} user attempts) → Individual answers
            </div>
            <br/>
            <div className="text-green-600 font-semibold">SERVICES:</div>
            <div className="ml-4 text-gray-700">
              ├── DashboardDataService → Unique question calculations<br/>
              └── QuizSessionManager → Session-based calculations
            </div>
            <br/>
            <div className="text-purple-600 font-semibold">COMPONENTS:</div>
            <div className="ml-4 text-gray-700">
              ├── Dashboard.tsx → Uses DashboardDataService<br/>
              ├── QuizHistory.tsx → Uses DashboardDataService (updated)<br/>
              └── This Diagnostic → Direct database + both services
            </div>
          </div>
        </div>

        {/* Raw Session Data Preview */}
        {data.userSessions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-xl mr-2">🔍</span>
              Recent Quiz Sessions (Raw Data)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 border">Session ID</th>
                    <th className="text-left p-2 border">Questions</th>
                    <th className="text-left p-2 border">Correct</th>
                    <th className="text-left p-2 border">Accuracy</th>
                    <th className="text-left p-2 border">XP</th>
                    <th className="text-left p-2 border">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userSessions.slice(0, 5).map((session, index) => (
                    <tr key={session.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-2 border font-mono text-xs">{session.id.substring(0, 8)}...</td>
                      <td className="p-2 border text-center">{session.total_questions}</td>
                      <td className="p-2 border text-center">{session.correct_answers}</td>
                      <td className="p-2 border text-center">{Math.round(session.accuracy_percentage)}%</td>
                      <td className="p-2 border text-center">{session.total_xp_earned}</td>
                      <td className="p-2 border text-xs">{new Date(session.completed_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.userSessions.length > 5 && (
              <p className="text-xs text-gray-500 mt-2">Showing 5 of {data.userSessions.length} total sessions</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4 border-t">
          <p>🔧 IGCSE Quiz App Diagnostic Dashboard | Generated at {new Date().toISOString()}</p>
          <p className="mt-1">
            <a href="/" className="text-blue-600 hover:underline">← Back to Dashboard</a> | 
            <a href="/history" className="text-blue-600 hover:underline ml-2">View Quiz History</a>
          </p>
        </div>
      </div>
    </div>
  )
}
