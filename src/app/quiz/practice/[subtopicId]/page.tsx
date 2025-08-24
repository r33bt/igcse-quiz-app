'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AssessmentEngine } from '@/lib/assessment-engine'
import { IGCSEQuizAdapter, type IGCSESubtopic } from '@/lib/igcse-quiz-adapter'
import QuizInterfaceV2 from '@/components/QuizInterfaceV2'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, ArrowLeft, Loader2, Zap } from 'lucide-react'
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
  
  const { user } = useUser()

  // Initialize params (Next.js 15 compatibility)
  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      const resolvedSearchParams = await searchParams
      
      setSubtopicId(resolvedParams.subtopicId)
      setPaperPath(resolvedSearchParams.path?.toLowerCase() === 'extended' ? 'Extended' : 'Core')
      setFocus(resolvedSearchParams.focus)
    }
    
    initParams()
  }, [params, searchParams])

  // Load data when params are ready
  useEffect(() => {
    if (subtopicId) {
      loadQuizData()
    }
  }, [subtopicId, paperPath, focus]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuizData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load subtopic data
      const subtopicData = await getSubtopicData(subtopicId)
      if (!subtopicData) {
        notFound()
        return
      }
      setSubtopic(subtopicData)

      // Generate practice quiz
      const focusAreas = focus ? [focus.charAt(0).toUpperCase() + focus.slice(1)] : ['Medium', 'Hard']
      const quizData = await AssessmentEngine.generatePracticeQuiz(subtopicId, paperPath, focusAreas)
      if (!quizData) {
        throw new Error(`No questions available for ${paperPath} paper practice`)
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

  const getFocusIcon = () => {
    switch (focus) {
      case 'easy': return <span className="text-green-600">📚</span>
      case 'medium': return <span className="text-yellow-600">⚡</span>
      case 'hard': return <span className="text-red-600">🔥</span>
      default: return <Zap className="h-4 w-4" />
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Practice Unavailable
            </h2>
            <p className="text-gray-600 mb-4">
              {error || `No ${focus ? `${focus} difficulty` : ''} questions available for ${paperPath} paper practice.`}
            </p>
            <Link 
              href="/test-topics"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Topics
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show quiz interface once started - SIMPLE!
  if (quizStarted) {
    return (
      <QuizInterfaceV2
        user={IGCSEQuizAdapter.adaptUserData(user)}
        profile={null}
        subject={IGCSEQuizAdapter.adaptSubjectData(subtopic)}
        questions={IGCSEQuizAdapter.adaptQuestionData(quiz.questions, subtopic)}
      />
    )
  }

  // Show quiz preview and start button
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/test-topics"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
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
                {focus && (
                  <span className="flex items-center gap-1">
                    {getFocusIcon()}
                  </span>
                )}
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

          {/* Quiz Metadata */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>{quiz.questions.length} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <span>~{quiz.estimatedTimeMinutes} Minutes</span>
            </div>
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              Easy: {quiz.metadata.easyQuestions} • 
              Medium: {quiz.metadata.mediumQuestions} • 
              Hard: {quiz.metadata.hardQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Preview */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Practice Ready
            </h2>
            <p className="text-gray-600">
              {quiz.questions.length} {focus || 'mixed'} questions for {paperPath} paper practice
            </p>
          </div>

          {/* Start Quiz Button */}
          <div className="text-center">
            <button 
              onClick={handleStartQuiz}
              className={`px-8 py-3 text-white rounded-lg font-medium text-lg transition-colors ${
                paperPath === 'Core' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Server-side data loading function
async function getSubtopicData(subtopicId: string): Promise<IGCSESubtopic | null> {
  const supabase = createClient()
  
  const { data: subtopic, error } = await supabase
    .from('igcse_subtopics')
    .select(`
      id,
      subtopic_code,
      title,
      description,
      difficulty_level,
      igcse_topics (
        id,
        topic_number,
        title,
        color
      )
    `)
    .eq('id', subtopicId)
    .single()

  if (error || !subtopic) {
    console.error('Failed to load subtopic:', error)
    return null
  }
  
  // Fix the type issue
  return {
    ...subtopic,
    igcse_topics: subtopic.igcse_topics[0]
  } as IGCSESubtopic
}
