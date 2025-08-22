'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardDataService } from '@/lib/services/DashboardDataService'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { User } from '@supabase/supabase-js'
import { TabbedPageLayout } from '@/components/layouts/TabbedPageLayout'
import { StatsCard } from '@/components/sections/StatsCard'
import { HealthCheckCard } from '@/components/sections/HealthCheckCard'
import { QuestionAnalysisCard } from '@/components/sections/QuestionAnalysisCard'
import { Card } from '@/components/ui/card'

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
  timesAttempted: number
  timesCorrect: number
  accuracy: number
  lastAttempted?: string
  neverAttempted: boolean
}

interface DiagnosticData {
  totalQuestionsInDB: number
  allQuestions: DetailedQuestion[]
  userSessions: QuizSession[]
  userAttempts: QuizAttempt[]
  subjects: Subject[]
  attemptedQuestions: DetailedQuestion[]
  neverAttemptedQuestions: DetailedQuestion[]
  questionUsageStats: {
    mostUsed: DetailedQuestion[]
    leastUsed: DetailedQuestion[]
    perfectScore: DetailedQuestion[]
    strugglingWith: DetailedQuestion[]
  }
  dashboardServiceStats: DashboardStats
  quizSessionManagerStats: SessionStats
  consistencyChecks: {
    dashboardVsHistory: boolean
    calculationMatches: boolean
    dataIntegrity: boolean
    randomnessCheck: boolean
  }
}

export default function EnhancedDiagnostic() {
  const [data, setData] = useState<DiagnosticData | null>(null)
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

        const attemptedQuestions = detailedQuestions.filter(q => !q.neverAttempted)
        const neverAttemptedQuestions = detailedQuestions.filter(q => q.neverAttempted)

        const questionUsageStats = {
          mostUsed: attemptedQuestions.sort((a, b) => b.timesAttempted - a.timesAttempted).slice(0, 5),
          leastUsed: attemptedQuestions.sort((a, b) => a.timesAttempted - b.timesAttempted).slice(0, 5),
          perfectScore: attemptedQuestions.filter(q => q.accuracy === 100 && q.timesAttempted > 0),
          strugglingWith: attemptedQuestions.filter(q => q.accuracy < 50 && q.timesAttempted >= 2)
        }

        const dashboardStats = await dashboardService.getUserProgress(user.id)
        const sessionStats = await sessionManager.getUserQuizStats(user.id)

        const uniqueQuestionIds = [...new Set(userAttempts.map(a => a.question_id))]
        const consistencyChecks = {
          dashboardVsHistory: dashboardStats.questionsAnswered === uniqueQuestionIds.length,
          calculationMatches: dashboardStats.questionAttempts === userAttempts.length,
          dataIntegrity: allQuestions.length >= uniqueQuestionIds.length,
          randomnessCheck: uniqueQuestionIds.length < (allQuestions.length * 0.5)
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md border-red-200 bg-red-50">
          <h2 className="text-red-800 font-semibold mb-2">Diagnostic Error</h2>
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const tabs = [
    { id: 'overview', label: 'System Health', icon: '🏥' },
    { id: 'questions', label: 'Question Analysis', icon: '📚', count: `${data.attemptedQuestions.length}/${data.totalQuestionsInDB}` },
    { id: 'sessions', label: 'Session Details', icon: '🎯', count: data.userSessions.length },
    { id: 'analysis', label: 'Deep Analysis', icon: '🔍' }
  ]

  return (
    <TabbedPageLayout
      title="IGCSE Quiz App - Enhanced Diagnostic"
      subtitle="Comprehensive question analysis and system monitoring"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
      userEmail={user?.email}
    >
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <HealthCheckCard
              title="Dashboard vs History"
              status={data.consistencyChecks.dashboardVsHistory}
              successMessage="Data consistent"
              errorMessage="Calculation mismatch"
            />
            <HealthCheckCard
              title="Calculations"
              status={data.consistencyChecks.calculationMatches}
              successMessage="Services match"
              errorMessage="Calculation error"
            />
            <HealthCheckCard
              title="Data Integrity"
              status={data.consistencyChecks.dataIntegrity}
              successMessage="Database consistent"
              errorMessage="Data issue detected"
            />
            <HealthCheckCard
              title="Question Coverage"
              status={!data.consistencyChecks.randomnessCheck}
              successMessage="Good distribution"
              errorMessage="Low coverage detected"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Questions"
              value={data.totalQuestionsInDB}
              icon="📚"
              variant="blue"
            />
            <StatsCard
              title="Questions Attempted"
              value={data.attemptedQuestions.length}
              icon="🎯"
              variant="green"
            />
            <StatsCard
              title="Never Attempted"
              value={data.neverAttemptedQuestions.length}
              icon="❌"
              variant="red"
            />
            <StatsCard
              title="Coverage Rate"
              value={`${Math.round((data.attemptedQuestions.length / data.totalQuestionsInDB) * 100)}%`}
              icon="📊"
              variant="purple"
            />
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="text-xl mr-2">✅</span>
                Questions You&apos;ve Attempted ({data.attemptedQuestions.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.attemptedQuestions.map((q, index) => (
                  <QuestionAnalysisCard
                    key={q.id}
                    question={q}
                    index={index}
                    variant="attempted"
                  />
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="text-xl mr-2">❌</span>
                Never Attempted Questions ({data.neverAttemptedQuestions.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.neverAttemptedQuestions.map((q, index) => (
                  <QuestionAnalysisCard
                    key={q.id}
                    question={q}
                    index={data.attemptedQuestions.length + index}
                    variant="never-attempted"
                  />
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="text-xl mr-2">🎲</span>
              Quiz Generation Analysis
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">🔍 Key Finding</h4>
              <p className="text-yellow-700">
                <strong>Quiz selects 8 random questions</strong> from {data.totalQuestionsInDB} available, but you&apos;ve only encountered {data.attemptedQuestions.length} unique questions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard title="Questions per Quiz" value="8" variant="blue" />
              <StatsCard title="Total Available" value={data.totalQuestionsInDB} variant="green" />
              <StatsCard title="Actually Encountered" value={data.attemptedQuestions.length} variant="red" />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'sessions' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Quiz Sessions</h3>
          <p className="text-gray-600">Session details coming soon...</p>
        </Card>
      )}

      {activeTab === 'analysis' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Deep Analysis</h3>
          <p className="text-gray-600">Advanced analytics coming soon...</p>
        </Card>
      )}
    </TabbedPageLayout>
  )
}
