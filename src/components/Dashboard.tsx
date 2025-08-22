'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, Subject, UserProgress } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AppNavigation from '@/components/AppNavigation'
import { DashboardDataService } from '@/lib/services/DashboardDataService'

interface DashboardProps {
  user: User
  profile: Profile | null
  subjects: Subject[]
  userProgress: UserProgress[]
}

interface ActivityGroup {
  date: string
  attempts: {
    id: string
    is_correct: boolean
    xp_earned: number
    created_at: string
    questions?: {
      question_text: string
      subjects?: {
        name: string
        color: string
      }
    }
  }[]
}

interface DashboardStats {
  questionsAnswered: number
  questionAttempts: number
  answerAccuracy: number
  quizzesCompleted: number
  xpEarned: number
}

export default function Dashboard({ user, profile, subjects }: DashboardProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityGroup[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    questionsAnswered: 0,
    questionAttempts: 0,
    answerAccuracy: 0,
    quizzesCompleted: 0,
    xpEarned: 0
  })
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  // Ensure arrays are never null/undefined
  const safeSubjects = Array.isArray(subjects) ? subjects : []

  // Load dashboard statistics using centralized service
  const loadDashboardStats = useCallback(async () => {
    try {
      const dashboardService = new DashboardDataService()
      const stats = await dashboardService.getUserProgress(user.id)
      setDashboardStats(stats)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }, [user.id])

  // Load recent quiz activity
  const loadRecentActivity = useCallback(async () => {
    try {
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error loading recent activity:', error)
        return
      }

      // Group attempts by date for better display
      const dateGroups: Record<string, ActivityGroup> = {}

      attempts?.forEach(attempt => {
        const date = new Date(attempt.created_at).toDateString()
        if (!dateGroups[date]) {
          dateGroups[date] = {
            date,
            attempts: []
          }
        }
        dateGroups[date].attempts.push(attempt)
      })

      // Convert to array and take first 3 groups
      const sortedGroups = Object.values(dateGroups).slice(0, 3)
      setRecentActivity(sortedGroups)

    } catch (error) {
      console.error('Failed to load recent activity:', error)
    }
  }, [user.id, supabase])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        loadRecentActivity(),
        loadDashboardStats()
      ])
      setLoading(false)
    }
    loadData()
  }, [loadRecentActivity, loadDashboardStats])

  const startQuiz = (subjectId: string) => {
    const mathSubject = safeSubjects.find(s => s.name === 'Mathematics')
    if (mathSubject && subjectId === mathSubject.id) {
      router.push('/mathematics')
    } else {
      router.push(`/quiz/${subjectId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="mb-4">
            <a href="/diagnostic" className="text-blue-600 hover:text-blue-800 underline text-sm">
              ?? View Database Diagnostic
            </a>
          </div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || user.email?.split('@')[0] || 'Student'}!
          </h2>
          <p className="text-gray-600 mb-4">Ready to boost your IGCSE knowledge today?</p>

          {/* Quick Start Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-500 text-xl">??</div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">New to the app?</h3>
                <p className="text-blue-700 text-sm mb-2">
                  Click on a subject below to start practicing! You earn XP for every question (even wrong answers),
                  with bonus points for speed and accuracy.
                </p>
                <button
                  onClick={() => router.push('/guide')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                >
                  Read the complete guide ?
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <div className="w-6 h-6 text-blue-600">??</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardStats.questionsAnswered}
                </p>
                <p className="text-xs text-gray-500">Unique questions attempted</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <div className="w-6 h-6 text-green-600">?</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Answer Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : `${dashboardStats.answerAccuracy}%`}
                </p>
                <p className="text-xs text-gray-500">Correct answer rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <div className="w-6 h-6 text-yellow-600">?</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">XP Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardStats.xpEarned}
                </p>
                <p className="text-xs text-gray-500">Total experience points</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <div className="w-6 h-6 text-purple-600">??</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quizzes Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardStats.quizzesCompleted}
                </p>
                <p className="text-xs text-gray-500">Quiz sessions finished</p>
              </div>
            </div>
          </div>
        </div>

        {/* Choose a Subject */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Choose a Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeSubjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: subject.color || '#3B82F6' }}
                    >
                      {subject.name[0]}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 min-h-[2.5rem]">
                    {subject.description || `Master ${subject.name} concepts with our comprehensive question bank.`}
                  </p>
                  
                  <button
                    onClick={() => startQuiz(subject.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {subject.name === 'Mathematics' ? 'Mathematics Hub' : 'Start Quiz'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Quiz Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent Quiz Activity</h3>
            <button
              onClick={() => router.push('/history')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All History ?
            </button>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading recent activity...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">??</div>
              <p className="text-gray-600 mb-4">No quiz activity yet</p>
              <p className="text-gray-500 text-sm">Start your first quiz to see your progress here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((group, groupIndex) => (
                <div key={groupIndex} className="bg-white rounded-xl shadow-sm border p-6">
                  <h4 className="font-medium text-gray-900 mb-3">{group.date}</h4>
                  <div className="space-y-2">
                    {group.attempts.map((attempt, attemptIndex) => (
                      <div key={attemptIndex} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            attempt.is_correct ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {attempt.is_correct ? '?' : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Mathematics Question
                            </p>
                            <p className="text-xs text-gray-500">
                              Mathematics
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-yellow-600">+{attempt.xp_earned} XP</p>
                          <p className="text-xs text-gray-500">
                            {new Date(attempt.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}



