'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AssessmentEngine } from '@/lib/assessment-engine'
import { IGCSEQuizAdapter, type IGCSESubtopic } from '@/lib/igcse-quiz-adapter'
import QuizInterfaceV2 from '@/components/QuizInterfaceV2'
import { Card, CardContent } from '@/components/ui/card'
import { Target, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

interface PageProps {
  params: Promise<{ subtopicId: string }>
  searchParams: Promise<{ path?: string }>
}

export default function AssessmentQuizPage({ params, searchParams }: PageProps) {
  const [subtopicId, setSubtopicId] = useState<string>('')
  const [paperPath, setPaperPath] = useState<'Core' | 'Extended'>('Core')
  const [subtopic, setSubtopic] = useState<IGCSESubtopic | null>(null)
  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  
  const { user } = useUser()

  useEffect(() => {
    const initParams = async () => {
      try {
        const resolvedParams = await params
        const resolvedSearchParams = await searchParams
        
        setSubtopicId(resolvedParams.subtopicId)
        setPaperPath(resolvedSearchParams.path?.toLowerCase() === 'extended' ? 'Extended' : 'Core')
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
  }, [subtopicId, paperPath]) // eslint-disable-line react-hooks/exhaustive-deps

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

      const quizData = await AssessmentEngine.generateBaselineQuiz(subtopicId, paperPath)
      if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        setError(`No questions available for ${paperPath} paper assessment`)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading assessment...</span>
        </div>
      </div>
    )
  }

  if (error || !subtopic || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Unavailable</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/test-topics" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Topics
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {subtopic.subtopic_code} {subtopic.title}
              </h1>
              <p className="text-gray-600 text-sm">{subtopic.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to Begin Assessment</h2>
            <p className="text-gray-600">{quiz.questions?.length || 0} questions to evaluate your current level</p>
          </div>
          <div className="text-center">
            <button 
              onClick={handleStartQuiz}
              className={`px-8 py-3 text-white rounded-lg font-medium text-lg transition-colors ${
                paperPath === 'Core' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              Start {paperPath} Assessment
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
