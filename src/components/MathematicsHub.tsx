'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, Subject, Question, UserProgress } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QuizAttempt {
  id: string
  question_id: string
  user_answer: string
  is_correct: boolean
  xp_earned: number
  created_at: string
  questions: Question
}

interface QuizSession {
  id: string
  started_at: string
  completed_at: string
  total_questions: number
  correct_answers: number
  total_xp_earned: number
  accuracy_percentage: number
}

interface MathematicsHubProps {
  user: User
  profile: Profile | null
  subject: Subject
  questions: Question[]
  userProgress?: UserProgress | null
  recentAttempts: QuizAttempt[]
  recentSessions: QuizSession[]
}

export default function MathematicsHub({
  profile,
  subject,
  questions,
  userProgress,
  recentAttempts,
  recentSessions
}: MathematicsHubProps) {
  const [showTutorial, setShowTutorial] = useState(!userProgress)
  const router = useRouter()

  // Calculate statistics
  const totalQuestions = questions.length
  const questionsAnswered = userProgress?.total_questions_answered || 0
  const accuracy = userProgress?.accuracy_percentage || 0
  const currentLevel = profile?.level || 1
  const totalXP = profile?.xp || 0

  // Group questions by topic and difficulty
  const questionsByTopic = questions.reduce((acc, q) => {
    const topic = q.topic || 'General'
    if (!acc[topic]) acc[topic] = { easy: 0, medium: 0, hard: 0, total: 0 }
    if (q.difficulty_level === 1) acc[topic].easy++
    else if (q.difficulty_level === 2) acc[topic].medium++
    else if (q.difficulty_level === 3) acc[topic].hard++
    acc[topic].total++
    return acc
  }, {} as Record<string, { easy: number, medium: number, hard: number, total: number }>)

  const topicNames = Object.keys(questionsByTopic)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
              >
                <span className="text-lg mr-2">←</span>
                Back to Dashboard
              </Link>
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold mr-4"
                  style={{ backgroundColor: subject.color || '#3B82F6' }}
                >
                  📊
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mathematics Hub</h1>
                  <p className="text-sm text-gray-600">Your IGCSE Mathematics Learning Center</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">Level {currentLevel}</div>
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">⚡</span>
                  <span className="font-bold text-yellow-600">{totalXP} XP</span>
                </div>
              </div>
              <Link
                href="/guide"
                className="text-gray-500 hover:text-blue-600 text-xl"
                title="Help & Guide"
              >
                ❓
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tutorial/Welcome Section */}
        {showTutorial && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🎓</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-900 mb-2">
                  Welcome to your Mathematics Learning Hub!
                </h3>
                <p className="text-blue-800 mb-4">
                  This is your dedicated space for mastering IGCSE Mathematics. Here&apos;s how it works:
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">1️⃣</span>
                    <div>
                      <strong className="text-blue-900">Take Quizzes</strong>
                      <p className="text-sm text-blue-700">Practice with randomized questions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">2️⃣</span>
                    <div>
                      <strong className="text-blue-900">Earn XP</strong>
                      <p className="text-sm text-blue-700">Gain points and level up</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">3️⃣</span>
                    <div>
                      <strong className="text-blue-900">Track Progress</strong>
                      <p className="text-sm text-blue-700">See your improvement over time</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Got it, let&apos;s start! ✨
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalQuestions}</div>
            <div className="text-gray-600">Questions Available</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{questionsAnswered}</div>
            <div className="text-gray-600">Questions Attempted</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{accuracy.toFixed(0)}%</div>
            <div className="text-gray-600">Overall Accuracy</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{currentLevel}</div>
            <div className="text-gray-600">Current Level</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Topics Overview */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Topics Available</h3>
            <div className="space-y-3">
              {topicNames.map((topic) => {
                const topicData = questionsByTopic[topic]
                return (
                  <div key={topic} className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-blue-900">{topic}</h4>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {topicData.total} questions
                      </span>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-green-600">🟢 Easy: {topicData.easy}</span>
                      <span className="text-yellow-600">🟡 Medium: {topicData.medium}</span>
                      <span className="text-red-600">🔴 Hard: {topicData.hard}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Start Quiz Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push(`/quiz/${subject.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                🚀 Start Mathematics Quiz
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            
            {/* Recent Quiz Sessions */}
            {recentSessions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">📈 Recent Quiz Sessions</h3>
                  <Link 
                    href="/history"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          session.accuracy_percentage >= 80 ? 'bg-green-500' :
                          session.accuracy_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="font-medium">{session.correct_answers}/{session.total_questions} correct</div>
                          <div className="text-sm text-gray-600">
                            {new Date(session.completed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-yellow-600">+{session.total_xp_earned} XP</div>
                        <div className="text-sm text-gray-600">{session.accuracy_percentage.toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Individual Questions */}
            {recentAttempts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 Recent Questions</h3>
                <div className="space-y-3">
                  {recentAttempts.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg ${attempt.is_correct ? 'text-green-500' : 'text-red-500'}`}>
                          {attempt.is_correct ? '✅' : '❌'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {attempt.questions.question_text.length > 50 
                              ? `${attempt.questions.question_text.substring(0, 50)}...`
                              : attempt.questions.question_text}
                          </div>
                          <div className="text-xs text-gray-600">
                            {attempt.questions.topic} • Level {attempt.questions.difficulty_level}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-600">+{attempt.xp_earned} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for New Users */}
            {recentAttempts.length === 0 && recentSessions.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to get started?</h3>
                <p className="text-gray-600 mb-4">
                  Take your first Mathematics quiz to begin tracking your progress!
                </p>
                <button
                  onClick={() => router.push(`/quiz/${subject.id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Take First Quiz ✨
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href={`/quiz/${subject.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            📝 Take Quiz
          </Link>
          <Link
            href="/history"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            📊 View History
          </Link>
          <Link
            href="/guide"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            📖 User Guide
          </Link>
        </div>
      </main>
    </div>
  )
}