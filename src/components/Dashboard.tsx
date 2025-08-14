'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, Subject, UserProgress } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AppNavigation from '@/components/AppNavigation'

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

export default function Dashboard({ user, profile, subjects, userProgress }: DashboardProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityGroup[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Ensure arrays are never null/undefined with comprehensive type checking
  const safeSubjects = Array.isArray(subjects) ? subjects : []
  const safeUserProgress = Array.isArray(userProgress) ? userProgress : []

  // Load recent quiz activity
  const loadRecentActivity = useCallback(async () => {
      try {
        
        // Get recent quiz attempts with question and subject info
        const { data: attempts, error } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            questions:questions(
              question_text,
              subjects:subjects(name, color)
            )
          `)
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
    loadRecentActivity()
  }, [loadRecentActivity])


  const startQuiz = (subjectId: string) => {
    // Check if this is Mathematics - redirect to mathematics hub instead of direct quiz
    const mathSubject = safeSubjects.find(s => s.name === 'Mathematics')
    if (mathSubject && subjectId === mathSubject.id) {
      router.push('/mathematics')
    } else {
      router.push(`/quiz/${subjectId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation user={user} profile={profile} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || user.email?.split('@')[0] || 'Student'}!
          </h2>
          <p className="text-gray-600 mb-4">Ready to boost your IGCSE knowledge today?</p>
          
          {/* Quick Start Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-500 text-xl">💡</div>
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
                  Read the complete guide →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <div className="w-6 h-6 text-blue-600">📊</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {safeUserProgress.reduce((acc, progress) => acc + progress.total_questions_answered, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <div className="w-6 h-6 text-green-600">✅</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {safeUserProgress.length > 0 
                    ? Math.round(
                        safeUserProgress.reduce((acc, progress) => acc + progress.accuracy_percentage, 0) / safeUserProgress.length
                      )
                    : 0
                  }%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <div className="w-6 h-6 text-orange-600">🔥</div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">{profile?.study_streak || 0} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose a Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeSubjects.map((subject) => {
              const progress = safeUserProgress.find(p => p.subject_id === subject.id)
              return (
                <div
                  key={subject.id}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => startQuiz(subject.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: subject.color || '#3B82F6' }}
                      >
                        {subject.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {subject.name}
                        </h4>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                      </div>
                    </div>
                    
                    {progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progress.accuracy_percentage.toFixed(1)}% accuracy</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress.accuracy_percentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {progress.total_questions_answered} questions completed
                        </p>
                      </div>
                    )}
                    
                    {!progress && (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm mb-2">Get started!</p>
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          New Subject
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 pb-6">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                      Start Quiz
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {safeUserProgress.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Progress</h3>
            <div className="space-y-4">
              {safeUserProgress.slice(0, 3).map((progress) => {
                const subject = safeSubjects.find(s => s.id === progress.subject_id)
                return (
                <div key={progress.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3"
                      style={{ backgroundColor: subject?.color || '#3B82F6' }}
                    >
                      {subject?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{subject?.name}</p>
                      <p className="text-sm text-gray-600">
                        {progress.total_questions_answered} questions • {progress.accuracy_percentage.toFixed(1)}% accuracy
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => startQuiz(progress.subject_id)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Continue →
                  </button>
                </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Quiz Activity */}
        {recentActivity.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Recent Quiz Activity</h3>
              <button
                onClick={() => router.push('/history')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All History →
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((group, groupIndex) => {
                const formatDate = (dateString: string) => {
                  const date = new Date(dateString)
                  const today = new Date().toDateString()
                  const yesterday = new Date(Date.now() - 86400000).toDateString()
                  
                  if (date.toDateString() === today) return 'Today'
                  if (date.toDateString() === yesterday) return 'Yesterday'
                  return date.toLocaleDateString()
                }

                return (
                  <div key={groupIndex} className="border-l-4 border-blue-200 pl-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {formatDate(group.date)}
                    </p>
                    <div className="space-y-2">
                      {group.attempts.map((attempt, attemptIndex: number) => (
                        <div 
                          key={attemptIndex}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: attempt.questions?.subjects?.color || '#3B82F6' }}
                            >
                              {attempt.questions?.subjects?.name?.charAt(0) || 'Q'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {attempt.questions?.subjects?.name || 'Unknown Subject'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attempt.questions?.question_text?.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${
                              attempt.is_correct ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {attempt.is_correct ? '✅' : '❌'}
                            </span>
                            <span className="text-sm font-medium text-yellow-600">
                              +{attempt.xp_earned || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}