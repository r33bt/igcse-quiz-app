// Same pattern as assessment but with practice-specific content
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AssessmentEngine } from '@/lib/assessment-engine'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Clock, BarChart3, ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ subtopicId: string }>
  searchParams: Promise<{ path?: string; focus?: string }>
}

async function getSubtopicData(subtopicId: string) {
  const supabase = await createClient()
  
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

  if (error || !subtopic) return null
  return subtopic
}

async function generatePracticeQuiz(
  subtopicId: string, 
  userPath: 'Core' | 'Extended',
  focus?: string
) {
  try {
    const focusAreas = focus ? [focus.charAt(0).toUpperCase() + focus.slice(1)] : ['Medium', 'Hard']
    return await AssessmentEngine.generatePracticeQuiz(subtopicId, userPath, focusAreas)
  } catch (error) {
    console.error('Failed to generate practice quiz:', error)
    return null
  }
}

export default async function PracticeQuizPage({ params, searchParams }: PageProps) {
  const { subtopicId } = await params
  const resolvedSearchParams = await searchParams
  const paperPath = (resolvedSearchParams.path?.toLowerCase() === 'extended' ? 'Extended' : 'Core') as 'Core' | 'Extended'
  const focus = resolvedSearchParams.focus
  
  // Load subtopic data
  const subtopic = await getSubtopicData(subtopicId)
  if (!subtopic) {
    notFound()
  }

  // Generate practice quiz
  const quiz = await generatePracticeQuiz(subtopicId, paperPath, focus)
  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Brain className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Practice Unavailable
            </h2>
            <p className="text-gray-600 mb-4">
              No {focus ? `${focus} difficulty` : ''} questions available for {paperPath} paper practice.
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

  const getFocusIcon = () => {
    switch (focus) {
      case 'easy': return <span className="text-green-600">📚</span>
      case 'medium': return <span className="text-yellow-600">⚡</span>
      case 'hard': return <span className="text-red-600">🔥</span>
      default: return <Zap className="h-4 w-4" />
    }
  }

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
              <BarChart3 className="h-4 w-4" />
              <span>{quiz.questions.length} Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
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

      {/* Simple Quiz Display */}
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

          {/* Quiz Questions Preview */}
          <div className="space-y-4">
            {quiz.questions.slice(0, 2).map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Question {index + 1}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    question.difficulty === 1 ? 'bg-green-100 text-green-800' :
                    question.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {question.difficulty_label}
                  </span>
                </div>
                <p className="text-gray-900">{question.question_text}</p>
              </div>
            ))}
            
            {quiz.questions.length > 2 && (
              <div className="text-center text-gray-500 text-sm">
                ... and {quiz.questions.length - 2} more questions
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-center">
            <Link 
              href="/test-topics"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Topics
            </Link>
            <button className={`px-6 py-2 text-white rounded-lg font-medium ${
              paperPath === 'Core' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}>
              Start Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
