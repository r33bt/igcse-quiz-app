'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardDataService } from '@/lib/services/DashboardDataService'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { User } from '@supabase/supabase-js'

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
}

interface Question {
  id: string
  question_text: string
}

interface DashboardStats {
  questionsAnswered: number
  questionAttempts: number
  quizzesCompleted: number
  answerAccuracy: number
  xpEarned: number
}

interface SessionStats {
  totalQuizzes: number
  totalQuestions: number
  totalCorrect: number
  averageAccuracy: number
  totalXP: number
}

interface DiagnosticData {
  totalQuestionsInDB: number
  questionIds: string[]
  userSessions: QuizSession[]
  userAttempts: QuizAttempt[]
  dashboardServiceStats: DashboardStats
  quizSessionManagerStats: SessionStats
  uniqueQuestionsAttempted: number
  uniqueQuestionIds: string[]
  totalAttemptCount: number
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
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function loadComprehensiveData() {
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

        const [questionsResult, sessionsResult, attemptsResult] = await Promise.all([
          supabase.from('questions').select('*'),
          supabase.from('quiz_sessions').select('*').eq('user_id', user.id),
          supabase.from('quiz_attempts').select('*').eq('user_id', user.id)
        ])

        const dashboardStats = await dashboardService.getUserProgress(user.id)
        const sessionStats = await sessionManager.getUserQuizStats(user.id)
        
        const uniqueQuestionIds = [...new Set(attemptsResult.data?.map(a => a.question_id) || [])]
        
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-xl mr-2">📚</span>
              Questions Database
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
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-xl mr-2">🎯</span>
              Your Quiz Activity
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="text-xl mr-2">⚖️</span>
            Service Calculation Comparison
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-blue-700 mb-3">📊 DashboardDataService</h4>
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
                  <span>Accuracy:</span>
                  <span className="font-mono font-bold">{data.dashboardServiceStats.answerAccuracy}%</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-3">📈 QuizSessionManager</h4>
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
                  <span>Accuracy:</span>
                  <span className="font-mono font-bold">{data.quizSessionManagerStats.averageAccuracy}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {data.userSessions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-xl mr-2">🔍</span>
              Recent Quiz Sessions
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
