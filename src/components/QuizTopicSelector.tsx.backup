"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import SubtopicProgressCard from './SubtopicProgressCard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type MasteryLevel = 'Unassessed' | 'Developing' | 'Approaching' | 'Proficient' | 'Mastery'

interface SubtopicProgress {
  subtopic_id: string
  mastery_level: MasteryLevel
  mastery_percentage: number
  core_questions_attempted: number
  core_questions_correct: number
  extended_questions_attempted: number
  extended_questions_correct: number
  easy_questions_attempted: number
  easy_questions_correct: number
  medium_questions_attempted: number
  medium_questions_correct: number
  hard_questions_attempted: number
  hard_questions_correct: number
  questions_attempted: number
  questions_correct: number
  baseline_assessment_completed: boolean
  last_practiced: string | null
}

interface IGCSESubtopic {
  id: string
  topic_id: string
  subtopic_code: string
  title: string
  description: string
  paper_type: 'Core' | 'Extended'
}

interface IGCSETopic {
  id: string
  topic_number: number
  title: string
  description: string
  color: string
}

interface QuestionAvailability {
  total: number
  byDifficulty: { easy: number, medium: number, hard: number }
  byCategory: { core: number, extended: number }
  baselineReady: number
}

export default function QuizTopicSelector() {
  const [topics, setTopics] = useState<IGCSETopic[]>([])
  const [subtopics, setSubtopics] = useState<IGCSESubtopic[]>([])
  const [progressData, setProgressData] = useState<SubtopicProgress[]>([])
  const [questionAvailability, setQuestionAvailability] = useState<Record<string, QuestionAvailability>>({})
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // CRITICAL: Use fallback test user for development/testing
  const fallbackUserId = "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  
  // Get user ID (with fallback for testing)
  const getUserId = () => {
    // Try to get from auth session first (when auth is implemented)
    // For now, use fallback test user
    return fallbackUserId
  }

  const loadTopicsAndSubtopics = async () => {
    try {
      setLoading(true)
      
      // Load IGCSE topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('topic_number')

      if (topicsError) throw topicsError

      // Load IGCSE subtopics  
      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .order('subtopic_code')

      if (subtopicsError) throw subtopicsError

      // Load user progress data
      const userId = getUserId()
      const { data: progressData, error: progressError } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', userId)

      if (progressError) throw progressError

      // Load question availability data
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('question_selection_helper')
        .select('*')

      if (availabilityError) throw availabilityError

      // Process availability data
      const availabilityMap: Record<string, QuestionAvailability> = {}
      availabilityData?.forEach(item => {
        if (!availabilityMap[item.subtopic_id]) {
          availabilityMap[item.subtopic_id] = {
            total: 0,
            byDifficulty: { easy: 0, medium: 0, hard: 0 },
            byCategory: { core: 0, extended: 0 },
            baselineReady: 0
          }
        }

        const availability = availabilityMap[item.subtopic_id]
        availability.total = item.total_questions || 0
        
        // Map difficulty levels
        if (item.difficulty === 1) availability.byDifficulty.easy = item.question_count || 0
        if (item.difficulty === 2) availability.byDifficulty.medium = item.question_count || 0  
        if (item.difficulty === 3) availability.byDifficulty.hard = item.question_count || 0
        
        // Map paper types
        if (item.paper_type === 'Core') availability.byCategory.core = item.question_count || 0
        if (item.paper_type === 'Extended') availability.byCategory.extended = item.question_count || 0
        
        if (item.is_baseline_question) {
          availability.baselineReady += item.question_count || 0
        }
      })

      setTopics(topicsData || [])
      setSubtopics(subtopicsData || [])
      setProgressData(progressData || [])
      setQuestionAvailability(availabilityMap)

    } catch (error: unknown) {
      console.error('Error loading data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopicsAndSubtopics()
  }, [])

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopics(newExpanded)
  }

  const getSubtopicsForTopic = (topicId: string): IGCSESubtopic[] => {
    return subtopics.filter(subtopic => subtopic.topic_id === topicId)
  }

  const getProgressForSubtopic = (subtopicId: string): SubtopicProgress | undefined => {
    return progressData.find(progress => progress.subtopic_id === subtopicId)
  }

  const getAvailabilityForSubtopic = (subtopicId: string): QuestionAvailability => {
    return questionAvailability[subtopicId] || {
      total: 0,
      byDifficulty: { easy: 0, medium: 0, hard: 0 },
      byCategory: { core: 0, extended: 0 },
      baselineReady: 0
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-2xl font-semibold text-gray-700 mb-4">
              Loading IGCSE Mathematics Topics...
            </div>
            <div className="text-gray-500">
              Preparing your personalized learning experience
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-2xl font-semibold text-red-700 mb-4">
              Error Loading Data
            </div>
            <div className="text-red-600 mb-6">
              {error}
            </div>
            <Button 
              onClick={loadTopicsAndSubtopics}
              className="bg-red-600 hover:bg-red-700"
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IGCSE Mathematics Learning Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master the complete Cambridge IGCSE Mathematics syllabus with our intelligent 
            assessment system. Track your progress across all topics and difficulty levels.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{topics.length}</div>
              <div className="text-gray-600">Core Topics</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{subtopics.length}</div>
              <div className="text-gray-600">Subtopics</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {progressData.filter(p => p.questions_attempted > 0).length}
              </div>
              <div className="text-gray-600">Started</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {progressData.filter(p => p.mastery_percentage >= 75).length}
              </div>
              <div className="text-gray-600">Mastered</div>
            </CardContent>
          </Card>
        </div>

        {/* Topics and Subtopics */}
        <div className="space-y-6">
          {topics.map((topic) => {
            const topicSubtopics = getSubtopicsForTopic(topic.id)
            const isExpanded = expandedTopics.has(topic.id)
            
            return (
              <Card key={topic.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleTopic(topic.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-4 h-8 rounded"
                        style={{ backgroundColor: topic.color }}
                      />
                      <div>
                        <CardTitle className="text-xl">
                          {topic.topic_number}. {topic.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {topic.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">
                        {topicSubtopics.length} subtopics
                      </Badge>
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {topicSubtopics.map((subtopic) => {
                        const subtopicProgress = getProgressForSubtopic(subtopic.id)
                        const availability = getAvailabilityForSubtopic(subtopic.id)
                        
                        return (
                          <SubtopicProgressCard
                            key={subtopic.id}
                            subtopic={subtopic}
                            progress={subtopicProgress}
                            availability={availability}
                          />
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
