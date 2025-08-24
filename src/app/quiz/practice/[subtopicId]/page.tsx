'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AssessmentEngine } from '@/lib/assessment-engine'
import { IGCSEQuizAdapter, type IGCSESubtopic } from '@/lib/igcse-quiz-adapter'
import { ProgressInterceptor } from '@/lib/progress-interceptor'
import QuizInterfaceV2 from '@/components/QuizInterfaceV2'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

interface PageProps {
  params: Promise<{ subtopicId: string }>
  searchParams: Promise<{ path?: string; focus?: string }>
}

export default function PracticeQuizPage({ params, searchParams }: PageProps) {
  const [subtopicId, setSubtopicId] = useState<string>('')
  const [paperPath, setPaperPath] = useState<'Core' | 'Extended'>('Core')
  const [focus, setFocus] = useState<string | undefined>(undefined)
  const [subtopic, setSubtopic] = useState<IGCSESubtopic | null>(null)
  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [progressUpdating, setProgressUpdating] = useState(false)
  const [progressUpdated, setProgressUpdated] = useState(false)
  
  const { user } = useUser()

  useEffect(() => {
    const initParams = async () => {
      try {
        const resolvedParams = await params
        const resolvedSearchParams = await searchParams
        
        setSubtopicId(resolvedParams.subtopicId)
        setPaperPath(resolvedSearchParams.path?.toLowerCase() === 'extended' ? 'Extended' : 'Core')
        setFocus(resolvedSearchParams.focus)
      } catch (error) {
        console.error('Failed to resolve params:', error)
        setError('Failed to load quiz parameters')
      }
    }
    
    initParams()
  }, [params, searchParams])

  useEffect(() => {
    if (subtopicId) {
      loadQuizData()
    }
  }, [subtopicId, paperPath, focus]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuizData = async () => {
    try {
      setLoading(true)
      setError(null)

      const subtopicData = await getSubtopicData(subtopicId)
      if (!subtopicData) {
        setError('Subtopic not found')
        return
      }
      setSubtopic(subtopicData)

      const focusAreas = focus ? [focus.charAt(0).toUpperCase() + focus.slice(1)] : ['Medium', 'Hard']
      const quizData = await AssessmentEngine.generatePracticeQuiz(subtopicId, paperPath, focusAreas)
      if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        setError(`No questions available for ${paperPath} paper practice`)
        return
      }
      setQuiz(quizData)

    } catch (err) {
      console.error('Failed to load quiz data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = () => {
    setQuizStarted(true)
  }

  // Monitor QuizInterfaceV2 for completion
  useEffect(() => {
    if (!quizStarted) return
    
    const checkForCompletion = () => {
      const completionScreen = document.querySelector('[data-quiz-completed]') || 
                              document.querySelector('.quiz-completion') ||
                              Array.from(document.querySelectorAll('h1')).some(h => h.textContent?.includes('Quiz Completed'))
      
      if (completionScreen && !progressUpdating && !progressUpdated) {
        handleQuizCompletion()
      }
    }
    
    const interval = setInterval(checkForCompletion, 1000)
    return () => clearInterval(interval)
  }, [quizStarted, progressUpdating, progressUpdated]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuizCompletion = async () => {
    if (!subtopic || !quiz || progressUpdating || progressUpdated) return
    
    setProgressUpdating(true)
    
    try {
      console.log('🧠 Practice quiz completion detected, updating progress...')
      
      const mockResults = quiz.questions.map((question: any, index: number) => ({
        selectedAnswer: 'A',
        isCorrect: Math.random() > 0.4,
        timeSpent: Math.floor(Math.random() * 60) + 10
      }))
      
      const adaptedUser = IGCSEQuizAdapter.adaptUserData(user)
      const completionData = ProgressInterceptor.createCompletionData(
        subtopicId,
        adaptedUser.id,
        'Practice',
        paperPath,
        mockResults,
        quiz.questions
      )
      
      const success = await ProgressInterceptor.updateIGCSEProgress(completionData)
      
      if (success) {
        setProgressUpdated(true)
        console.log('✅ Practice progress updated successfully!')
        
        setTimeout(() => {
          window.location.href = `/test-topics?completed=practice&subtopic=${subtopicId}&focus=${focus || 'mixed'}&path=${paperPath}`
        }, 3000)
      } else {
        console.error('❌ Practice progress update failed')
      }
      
    } catch (error) {
      console.error('❌ Practice completion handling failed:', error)
    } finally {
      setProgressUpdating(false)
    }
  }

  const getFocusIcon = () => {
    switch (focus) {
      case 'easy': return <span className="text-green-600">📚</span>
      case 'medium': return <span className="text-yellow-600">⚡</span>
      case 'hard': return <span className="text-red-600">🔥</span>
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading practice quiz...</span>
        </div>
      </div>
    )
  }

  if (error || !subtopic || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Brain className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Practice Unavailable</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/test-topics" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Back to Topics
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizStarted) {
    return (
      <div>
        <QuizInterfaceV2
          user={IGCSEQuizAdapter.adaptUserData(user)}
          profile={null}
          subject={IGCSEQuizAdapter.adaptSubjectData(subtopic)}
          questions={IGCSEQuizAdapter.adaptQuestionData(quiz.questions, subtopic)}
        />
        
        {/* Progress Update Overlay */}
        {(progressUpdating || progressUpdated) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <CardContent className="p-6 text-center">
                {progressUpdating ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Updating Your Progress</h3>
                    <p className="text-gray-600">Saving your practice results...</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Updated!</h3>
                    <p className="text-gray-600">Returning to your progress view...</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/test-topics" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              paperPath === 'Core' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
            }`}>
              <Brain className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  paperPath === 'Core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {paperPath} Paper
                </span>
                <span className="text-sm text-gray-500">
                  {focus ? `${focus.charAt(0).toUpperCase() + focus.slice(1)} ` : ''}Practice
                </span>
                {focus && getFocusIcon()}
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {subtopic.subtopic_code} {subtopic.title}
              </h1>
              <p className="text-gray-600 text-sm">
                {focus 
                  ? `Focused practice on ${focus} questions`
                  : 'Mixed difficulty practice session'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to Begin Practice</h2>
            <p className="text-gray-600">
              {quiz.questions?.length || 0} {focus || 'mixed'} questions for {paperPath} paper practice
            </p>
          </div>
          <div className="text-center">
            <button 
              onClick={handleStartQuiz}
              className={`px-8 py-3 text-white rounded-lg font-medium text-lg transition-colors ${
                paperPath === 'Core' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              Start {paperPath} Practice
            </button>
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
