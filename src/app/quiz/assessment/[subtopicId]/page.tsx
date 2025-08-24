'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AssessmentEngine } from '@/lib/assessment-engine'
import { IGCSEQuizAdapter, type IGCSESubtopic } from '@/lib/igcse-quiz-adapter'
import { ProgressInterceptor } from '@/lib/progress-interceptor'
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

  // Initialize params (Next.js 15 compatibility)
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

  // Load data when params are ready
  useEffect(() => {
    if (subtopicId) {
      loadQuizData()
    }
  }, [subtopicId, paperPath]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuizData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load subtopic data with error handling
      const subtopicData = await getSubtopicData(subtopicId)
      if (!subtopicData) {
        setError('Subtopic not found')
        return
      }
      setSubtopic(subtopicData)

      // Generate assessment quiz with error handling
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

  const handleRetry = () => {
    setQuizStarted(false)
    setError(null)
    loadQuizData()
  }

  // Enhanced quiz completion handler
  const handleQuizComplete = async (results: any) => {
    try {
      console.log('📊 Quiz completed, updating IGCSE progress...', results)
      
      // Extract results - handle different result formats
      let quizResults: any[] = []
      
      if (results.answers && Array.isArray(results.answers)) {
        // Format 1: results.answers array
        quizResults = results.answers.map((answer: any, index: number) => ({
          questionId: quiz.questions[index]?.id || `q-${index}`,
          userAnswer: answer.selectedAnswer || answer.answer || '',
          correctAnswer: quiz.questions[index]?.correct_answer || '',
          isCorrect: answer.isCorrect ?? (answer.selectedAnswer === quiz.questions[index]?.correct_answer),
          difficulty: quiz.questions[index]?.difficulty || 1,
          paperType: quiz.questions[index]?.paper_type || 'Core'
        }))
      } else if (results.questions && Array.isArray(results.questions)) {
        // Format 2: results.questions array
        quizResults = results.questions.map((q: any) => ({
          questionId: q.id || 'unknown',
          userAnswer: q.userAnswer || q.selectedAnswer || '',
          correctAnswer: q.correct_answer || '',
          isCorrect: q.isCorrect ?? (q.userAnswer === q.correct_answer),
          difficulty: q.difficulty || 1,
          paperType: q.paper_type || 'Core'
        }))
      } else {
        // Format 3: Direct results array
        quizResults = (Array.isArray(results) ? results : []).map((item: any, index: number) => ({
          questionId: quiz.questions[index]?.id || `q-${index}`,
          userAnswer: item.userAnswer || item.selectedAnswer || '',
          correctAnswer: quiz.questions[index]?.correct_answer || '',
          isCorrect: item.isCorrect ?? false,
          difficulty: quiz.questions[index]?.difficulty || 1,
          paperType: quiz.questions[index]?.paper_type || 'Core'
        }))
      }
      
      console.log('📈 Processed quiz results:', quizResults)
      
      // Update IGCSE progress
      const adaptedUser = IGCSEQuizAdapter.adaptUserData(user)
      await ProgressInterceptor.updateIGCSEProgress(
        adaptedUser.id,
        subtopicId,
        quizResults
      )
      
      console.log('✅ Progress updated successfully!')
      
      // Navigate back to progress view
      setTimeout(() => {
        window.location.href = '/test-topics?completed=assessment&subtopic=' + subtopicId
      }, 2000)
      
    } catch (error) {
      console.error('❌ Failed to update progress:', error)
      alert('Quiz completed but failed to save progress. Please try again.')
    }
  }

  const handleQuizExit = () => {
    window.location.href = '/test-topics'
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Assessment Unavailable
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <div className="space-x-3">
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <Link 
                href="/test-topics"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Topics
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show quiz interface once started with error boundary
  if (quizStarted) {
    try {
      return (
        <QuizInterfaceV2
          user={IGCSEQuizAdapter.adaptUserData(user)}
          profile={null}
          subject={IGCSEQuizAdapter.adaptSubjectData(subtopic)}
          questions={IGCSEQuizAdapter.adaptQuestionData(quiz.questions, subtopic)}
          onQuizComplete={handleQuizComplete}
          onExit={handleQuizExit}
        />
      )
    } catch (error) {
      console.error('Quiz interface error:', error)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Quiz Error
              </h2>
              <p className="text-gray-600 mb-4">
                Something went wrong starting the quiz. Please try again.
              </p>
              <button 
                onClick={() => setQuizStarted(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      )
    }
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
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  paperPath === 'Core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {paperPath} Paper
                </span>
                <span className="text-sm text-gray-500">Assessment Quiz</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {subtopic.subtopic_code} {subtopic.title}
              </h1>
              <p className="text-gray-600 text-sm">
                {subtopic.description}
              </p>
            </div>
          </div>

          {/* Quiz Metadata */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>{quiz.questions?.length || 0} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <span>~{quiz.estimatedTimeMinutes || 10} Minutes</span>
            </div>
            {quiz.metadata && (
              <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                Easy: {quiz.metadata.easyQuestions || 0} • 
                Medium: {quiz.metadata.mediumQuestions || 0} • 
                Hard: {quiz.metadata.hardQuestions || 0}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Preview */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Begin Assessment
            </h2>
            <p className="text-gray-600">
              {quiz.questions?.length || 0} questions to evaluate your current level in {paperPath} paper
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
              Start {paperPath} Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Safe server-side data loading function
async function getSubtopicData(subtopicId: string): Promise<IGCSESubtopic | null> {
  const supabase = createClient()
  
  try {
    const { data: subtopic, error } = await supabase
      .from('igcse_subtopics')
      .select(`
        id,
        subtopic_code,
        title,
        description,
        difficulty_level,
        igcse_topics!inner (
          id,
          topic_number,
          title,
          color
        )
      `)
      .eq('id', subtopicId)
      .single()

    if (error) {
      console.error('Subtopic query error:', error)
      return null
    }

    if (!subtopic) {
      console.error('No subtopic found for ID:', subtopicId)
      return null
    }

    // Handle array vs object from join
    const topicData = Array.isArray(subtopic.igcse_topics) 
      ? subtopic.igcse_topics[0] 
      : subtopic.igcse_topics

    return {
      ...subtopic,
      igcse_topics: topicData || null
    } as IGCSESubtopic
    
  } catch (error) {
    console.error('Database query failed:', error)
    return null
  }
}
