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

        {/* Quiz Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{recentSessions.length}</div>
            <div className="text-gray-600">Quizzes Completed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {recentSessions.length > 0 
                ? Math.round(recentSessions.reduce((acc, s) => acc + s.accuracy_percentage, 0) / recentSessions.length)
                : 0}%
            </div>
            <div className="text-gray-600">Average Quiz Score</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {recentSessions.reduce((acc, s) => acc + s.total_xp_earned, 0)}
            </div>
            <div className="text-gray-600">Total Quiz XP</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{currentLevel}</div>
            <div className="text-gray-600">Current Level</div>
          </div>
        </div>

        {/* Main Quiz Selection and Progress Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Quiz Selection */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">🎯 Choose Your Quiz</h3>
            
            {/* Quick Start - Onboarding Quiz */}
            {recentSessions.length === 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">🌟</div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-blue-900 mb-2">Start Your Mathematics Journey!</h4>
                    <p className="text-blue-800 mb-4">Take your first mixed quiz to get familiar with the system</p>
                    <button
                      onClick={() => router.push(`/quiz/${subject.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      🚀 Start Onboarding Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Type Selection */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">📚 Topic-Focused Quizzes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topicNames.map((topic) => {
                    const topicData = questionsByTopic[topic]
                    return (
                      <div key={topic} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-semibold text-gray-900">{topic}</h5>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {topicData.total} questions
                          </span>
                        </div>
                        <div className="flex space-x-2 text-xs mb-3">
                          <span className="text-green-600">Easy: {topicData.easy}</span>
                          <span className="text-yellow-600">Med: {topicData.medium}</span>
                          <span className="text-red-600">Hard: {topicData.hard}</span>
                        </div>
                        <button
                          onClick={() => router.push(`/quiz/${subject.id}?topic=${encodeURIComponent(topic)}`)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        >
                          Start {topic} Quiz
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">⚡ Difficulty-Based Quizzes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <div className="text-2xl mb-2">🟢</div>
                      <h5 className="font-semibold text-green-800">Easy Quiz</h5>
                      <p className="text-sm text-green-600">Foundation concepts</p>
                    </div>
                    <button
                      onClick={() => router.push(`/quiz/${subject.id}?difficulty=1`)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Start Easy Quiz
                    </button>
                  </div>
                  
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <div className="text-2xl mb-2">🟡</div>
                      <h5 className="font-semibold text-yellow-800">Medium Quiz</h5>
                      <p className="text-sm text-yellow-600">Intermediate level</p>
                    </div>
                    <button
                      onClick={() => router.push(`/quiz/${subject.id}?difficulty=2`)}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Start Medium Quiz
                    </button>
                  </div>
                  
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <div className="text-2xl mb-2">🔴</div>
                      <h5 className="font-semibold text-red-800">Hard Quiz</h5>
                      <p className="text-sm text-red-600">Advanced problems</p>
                    </div>
                    <button
                      onClick={() => router.push(`/quiz/${subject.id}?difficulty=3`)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Start Hard Quiz
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🎲 Mixed Practice</h4>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-semibold text-gray-900">Random Mixed Quiz</h5>
                      <p className="text-sm text-gray-600">All topics and difficulties combined</p>
                    </div>
                    <button
                      onClick={() => router.push(`/quiz/${subject.id}`)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Start Mixed Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Progression & Activity */}
          <div className="space-y-6">
            
            {/* Quiz Progression */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">🏆 Your Quiz Journey</h3>
                <Link 
                  href="/history"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View All →
                </Link>
              </div>
              
              {recentSessions.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to start?</h4>
                  <p className="text-gray-600 mb-4">Take your first quiz to begin your mathematics journey!</p>
                  <button
                    onClick={() => router.push(`/quiz/${subject.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Start First Quiz ✨
                  </button>
                </div>
              )}

              {recentSessions.length > 0 && (
                <div className="space-y-3">
                  {recentSessions.slice(0, 5).map((session, index) => {
                    const quizNumber = recentSessions.length - index;
                    const isLatest = index === 0;
                    const difficulty = 'Mixed'; // All quizzes are currently mixed type
                    
                    return (
                      <div key={session.id} className={`p-4 rounded-lg border-l-4 ${
                        isLatest ? 'bg-blue-50 border-l-blue-500' : 'bg-gray-50 border-l-gray-300'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`text-lg font-bold px-2 py-1 rounded-full text-xs ${
                              isLatest ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              Quiz {quizNumber}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`w-2 h-2 rounded-full ${
                                session.accuracy_percentage >= 80 ? 'bg-green-500' :
                                session.accuracy_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></span>
                              <span className="text-sm font-medium">
                                {session.correct_answers}/{session.total_questions}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-yellow-600">+{session.total_xp_earned} XP</div>
                            <div className="text-xs text-gray-500">{session.accuracy_percentage.toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{difficulty} • {new Date(session.completed_at).toLocaleDateString()}</span>
                          {isLatest && <span className="text-blue-600 font-medium">Latest</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Minimized Recent Questions */}
            {recentAttempts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">🔍 Recent Questions</h4>
                  <button 
                    onClick={() => router.push('/history')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-2">
                  {recentAttempts.slice(0, 3).map((attempt) => (
                    <div key={attempt.id} className="flex items-center space-x-3 p-2 rounded bg-gray-50">
                      <span className={`text-sm ${attempt.is_correct ? 'text-green-500' : 'text-red-500'}`}>
                        {attempt.is_correct ? '✅' : '❌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-600 truncate">
                          {attempt.questions.topic}
                        </div>
                      </div>
                      <div className="text-xs text-yellow-600 font-medium">+{attempt.xp_earned}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access Footer */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Need Help Getting Started?</h4>
            <div className="flex justify-center space-x-4">
              <Link
                href="/history"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                📊 View Full History
              </Link>
              <Link
                href="/guide"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                📖 User Guide
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}