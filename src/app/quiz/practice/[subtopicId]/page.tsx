import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AssessmentEngine } from '@/lib/assessment-engine'
import QuizInterface from '@/components/QuizInterface'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Clock, BarChart3, Zap } from 'lucide-react'

interface PageProps {
  params: { subtopicId: string }
  searchParams: { path?: string; focus?: string }
}

async function getSubtopicData(subtopicId: string) {
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
  const { subtopicId } = params
  const paperPath = (searchParams.path?.toLowerCase() === 'extended' ? 'Extended' : 'Core') as 'Core' | 'Extended'
  const focus = searchParams.focus
  
  // Load subtopic data
  const subtopic = await getSubtopicData(subtopicId)
  if (!subtopic) {
    notFound()
  }

  // Generate practice quiz
  const quiz = await generatePracticeQuiz(subtopicId, paperPath, focus)
  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Brain className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Practice Unavailable
            </h2>
            <p className="text-gray-600 mb-4">
              No {focus ? `${focus} difficulty` : ''} questions available for {paperPath} paper practice.
            </p>
            <p className="text-sm text-gray-500">
              Please try a different difficulty or paper path.
            </p>
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
          <div className="flex items-center gap-4">
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
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
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

      {/* Quiz Content */}
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading practice questions...</p>
          </div>
        </div>
      }>
        <QuizInterface
          user={null as any}
          profile={null}
          subject={{ 
            id: subtopic.igcse_topics.id, 
            name: subtopic.igcse_topics.title,
            code: subtopic.subtopic_code,
            color: subtopic.igcse_topics.color 
          }}
          questions={quiz.questions.map(q => ({
            ...q,
            subject_id: subtopic.igcse_topics.id,
            options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
            difficulty_level: q.difficulty,
            topic: subtopic.title,
            curriculum_reference: subtopic.subtopic_code,
            created_at: new Date().toISOString(),
            question_type: 'multiple_choice'
          }))}
        />
      </Suspense>
    </div>
  )
}
