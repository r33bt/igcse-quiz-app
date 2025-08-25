'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateComprehensiveMastery } from '@/lib/enhanced-mastery-calculator'
import { IGCSEQuizAdapter, type IGCSESubtopic } from '@/lib/igcse-quiz-adapter'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Target, Brain, Clock, ArrowRight, RotateCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

interface PageProps {
  params: Promise<{ subtopicId: string }>
  searchParams: Promise<{ 
    quizType?: string
    paperPath?: string
    focus?: string
    score?: string
    total?: string
    timeSpent?: string
    xpEarned?: string
  }>
}

interface QuizResultsData {
  quizType: string
  paperPath: string
  focus: string
  score: number
  total: number
  accuracy: number
  timeSpent: string
  xpEarned: number
  previousMastery?: number
  newMastery?: number
  levelImprovement?: boolean
}

export default function QuizResultsPage({ params, searchParams }: PageProps) {
  const [subtopicId, setSubtopicId] = useState<string>('')
  const [subtopic, setSubtopic] = useState<IGCSESubtopic | null>(null)
  const [results, setResults] = useState<QuizResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useUser()

  useEffect(() => {
    const initParams = async () => {
      try {
        const resolvedParams = await params
        const resolvedSearchParams = await searchParams
        
        setSubtopicId(resolvedParams.subtopicId)
        
        // Parse quiz results from URL parameters
        const quizResults: QuizResultsData = {
          quizType: resolvedSearchParams.quizType || 'Assessment',
          paperPath: resolvedSearchParams.paperPath || 'Core',
          focus: resolvedSearchParams.focus || '',
          score: parseInt(resolvedSearchParams.score || '0'),
          total: parseInt(resolvedSearchParams.total || '0'),
          accuracy: 0,
          timeSpent: resolvedSearchParams.timeSpent || '0',
          xpEarned: parseInt(resolvedSearchParams.xpEarned || '0')
        }
        
        quizResults.accuracy = quizResults.total > 0 
          ? Math.round((quizResults.score / quizResults.total) * 100)
          : 0
          
        setResults(quizResults)
        
      } catch (error) {
        console.error('Failed to resolve params:', error)
        setError('Failed to load quiz results')
      }
    }
    
    initParams()
  }, [params, searchParams])

  useEffect(() => {
    if (subtopicId) {
      loadSubtopicData()
    }
  }, [subtopicId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSubtopicData = async () => {
    try {
      setLoading(true)
      setError(null)

      const subtopicData = await getSubtopicData(subtopicId)
      if (!subtopicData) {
        setError('Subtopic not found')
        return
      }
      setSubtopic(subtopicData)

      // Load current progress to show improvement
      await loadProgressImprovement(subtopicId)

    } catch (err) {
      console.error('Failed to load subtopic data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const loadProgressImprovement = async (currentSubtopicId: string) => {
  const supabase = createClient()
  const adaptedUser = IGCSEQuizAdapter.adaptUserData(user)

  try {
    const { data: progress } = await supabase
      .from('user_subtopic_progress')
      .select('*')
      .eq('user_id', adaptedUser.id)
      .eq('subtopic_id', currentSubtopicId)
      .single()

    if (progress && results) {
      const masteryData = calculateComprehensiveMastery(progress)
      setResults(prev => prev ? {
        ...prev,
        newMastery: Math.round(masteryData.current.accuracy),
        levelImprovement: masteryData.current.level.level > 2 // Simple level check
      } : null)
    }
  } catch (error) {
    console.error('Failed to load progress improvement:', error)
  }
}


  const getQuizIcon = () => {
    switch (results?.quizType) {
      case 'Assessment': return <Target className="h-8 w-8" />
      case 'Practice': return <Brain className="h-8 w-8" />
      case 'Mastery': return <Trophy className="h-8 w-8" />
      default: return <Target className="h-8 w-8" />
    }
  }

  const getQuizColor = () => {
    if (!results) return 'blue'
    
    if (results.paperPath === 'Extended') return 'purple'
    
    switch (results.quizType) {
      case 'Assessment': return 'blue'
      case 'Practice': return 'orange' 
      case 'Mastery': return 'green'
      default: return 'blue'
    }
  }

  const getPerformanceMessage = () => {
    if (!results) return ''
    
    if (results.accuracy >= 90) return "Outstanding performance! 🎉"
    if (results.accuracy >= 75) return "Great job! 👏"
    if (results.accuracy >= 60) return "Good progress! 👍"
    if (results.accuracy >= 40) return "Keep practicing! 💪"
    return "Foundation building time! 📚"
  }

  const getFocusDisplay = () => {
    if (!results?.focus) return ''
    
    const focusIcons = {
      easy: '📚',
      medium: '⚡',
      hard: '🔥'
    }
    
    return `${focusIcons[results.focus.toLowerCase() as keyof typeof focusIcons] || ''} ${results.focus} Focus`
  }

  const formatTimeSpent = (seconds: string) => {
    const totalSeconds = parseInt(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your results...</span>
        </div>
      </div>
    )
  }

  if (error || !subtopic || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Unavailable</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/test-topics" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Topics
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const color = getQuizColor()
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      accent: 'bg-blue-100'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200', 
      text: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      accent: 'bg-purple-100'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-600', 
      button: 'bg-orange-600 hover:bg-orange-700',
      accent: 'bg-orange-100'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      accent: 'bg-green-100'
    }
  }[color]

  return (
    <div className={`min-h-screen ${colorClasses.bg}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses.accent} ${colorClasses.text}`}>
              {getQuizIcon()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Quiz Completed!</h1>
              <p className="text-gray-600">
                {subtopic.subtopic_code} {subtopic.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Results Card */}
          <div className="lg:col-span-2">
            <Card className={`${colorClasses.border} border-2`}>
              <CardContent className="p-8">
                {/* Quiz Type and Path */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses.accent} ${colorClasses.text}`}>
                      {results.quizType} Quiz
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {results.paperPath} Paper
                    </span>
                    {results.focus && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        {getFocusDisplay()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Display */}
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    {results.score}/{results.total}
                  </div>
                  <div className={`text-2xl font-semibold ${colorClasses.text} mb-2`}>
                    {results.accuracy}%
                  </div>
                  <p className="text-lg text-gray-600">
                    {getPerformanceMessage()}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold text-gray-900">Time</span>
                    </div>
                    <div className="text-lg text-gray-600">
                      {formatTimeSpent(results.timeSpent)}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold text-gray-900">XP Earned</span>
                    </div>
                    <div className="text-lg text-gray-600">
                      +{results.xpEarned}
                    </div>
                  </div>
                </div>

                {/* Progress Impact */}
                {results.newMastery && (
                  <div className={`p-4 ${colorClasses.accent} rounded-lg mb-6`}>
                    <h3 className={`font-semibold ${colorClasses.text} mb-2`}>Progress Impact</h3>
                    <p className="text-gray-700">
                      Your mastery level updated to <strong>{results.newMastery}%</strong>
                      {results.levelImprovement && (
                        <span className="ml-2 text-green-600 font-medium">Level Up! 🎉</span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Primary Action */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
                <Link 
                  href={`/test-topics?expanded=${subtopicId}&completed=true`}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-medium transition-colors ${colorClasses.button}`}
                >
                  <span>View Updated Progress</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  See your improvements and get personalized recommendations
                </p>
              </CardContent>
            </Card>

            {/* Secondary Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Keep Learning</h3>
                <div className="space-y-3">
                  <Link 
                    href={`/quiz/practice/${subtopicId}?path=${results.paperPath.toLowerCase()}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Practice Again</span>
                  </Link>
                  
                  <Link 
                    href={`/quiz/assessment/${subtopicId}?path=${results.paperPath.toLowerCase()}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Target className="h-4 w-4" />
                    <span>Take Assessment</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Session Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{results.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Correct:</span>
                    <span className="font-medium text-green-600">{results.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="font-medium">{results.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paper Type:</span>
                    <span className="font-medium">{results.paperPath}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

async function getSubtopicData(subtopicId: string): Promise<IGCSESubtopic | null> {
  const supabase = createClient()
  
  try {
    const { data: subtopic, error } = await supabase
      .from('igcse_subtopics')
      .select(`
        id, subtopic_code, title, description, difficulty_level,
        igcse_topics!inner (id, topic_number, title, color)
      `)
      .eq('id', subtopicId)
      .single()

    if (error || !subtopic) return null

    const topicData = Array.isArray(subtopic.igcse_topics) 
      ? subtopic.igcse_topics[0] 
      : subtopic.igcse_topics

    return { ...subtopic, igcse_topics: topicData || null } as IGCSESubtopic
  } catch (error) {
    console.error('Database query failed:', error)
    return null
  }
}
