"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, ChevronRight, Target, BookOpen, Play, BarChart3, Trophy, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Inline the types to avoid import issues for now
type MasteryLevel = 'Unassessed' | 'Developing' | 'Approaching' | 'Proficient' | 'Mastery'

interface IGCSETopic {
  id: string
  topic_number: number
  title: string
  description: string
  color: string
}

interface IGCSESubtopic {
  id: string
  topic_id: string
  subtopic_code: string
  title: string
  description: string
  difficulty_level: string
}

interface SubtopicProgress {
  subtopic_id: string
  user_id: string
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
  baseline_assessment_completed: boolean
  baseline_score: number
  current_mastery_level: MasteryLevel
  mastery_percentage: number
  recommended_next_action: string
}

interface EnhancedSubtopic extends IGCSESubtopic {
  progress?: SubtopicProgress
  masteryData?: {
    level: MasteryLevel
    percentage: number
    recommendedAction: string
    strengths: string[]
    weaknesses: string[]
  }
  questionAvailability?: {
    total: number
    baselineReady: number
    masteryReady: number
  }
}

interface QuizTopicSelectorProps {
  onTopicSelect: (topicId: string, subtopicId?: string) => void
}

export default function QuizTopicSelector({ onTopicSelect }: QuizTopicSelectorProps) {
  const [topics, setTopics] = useState<IGCSETopic[]>([])
  const [coreSubtopics, setCoreSubtopics] = useState<EnhancedSubtopic[]>([])
  const [extendedSubtopics, setExtendedSubtopics] = useState<EnhancedSubtopic[]>([])
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [userPath, setUserPath] = useState<'Core' | 'Extended'>('Core')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopicsAndProgress()
  }, [])

  const fetchTopicsAndProgress = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('topic_number', { ascending: true })

      if (topicsError) throw topicsError

      // Fetch subtopics
      const { data: coreData, error: coreError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('difficulty_level', 'Core')
        .order('subtopic_code', { ascending: true })

      if (coreError) throw coreError

      const { data: extendedData, error: extendedError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('difficulty_level', 'Extended')
        .order('subtopic_code', { ascending: true })

      if (extendedError) throw extendedError

      // Get question availability for each subtopic
      const enhancedCore = await Promise.all(
        (coreData || []).map(async (subtopic) => {
          // Get question count for this subtopic
          const { data: questionCount, error: questionError } = await supabase
            .from('questions')
            .select('id', { count: 'exact' })
            .eq('igcse_subtopic_id', subtopic.id)

          const questionAvailability = {
            total: questionCount?.length || 0,
            baselineReady: questionCount?.length || 0,
            masteryReady: questionCount?.length || 0
          }

          return {
            ...subtopic,
            questionAvailability
          } as EnhancedSubtopic
        })
      )

      const enhancedExtended = await Promise.all(
        (extendedData || []).map(async (subtopic) => {
          const { data: questionCount, error: questionError } = await supabase
            .from('questions')
            .select('id', { count: 'exact' })
            .eq('igcse_subtopic_id', subtopic.id)

          const questionAvailability = {
            total: questionCount?.length || 0,
            baselineReady: questionCount?.length || 0,
            masteryReady: questionCount?.length || 0
          }

          return {
            ...subtopic,
            questionAvailability
          } as EnhancedSubtopic
        })
      )

      setTopics(topicsData || [])
      setCoreSubtopics(enhancedCore)
      setExtendedSubtopics(enhancedExtended)

      console.log('Loaded topics:', topicsData?.length)
      console.log('Loaded core subtopics:', enhancedCore.length)
      console.log('Loaded extended subtopics:', enhancedExtended.length)

    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  const getSubtopicsForTopic = (topicId: string, level: 'Core' | 'Extended' = 'Core') => {
    const subtopics = level === 'Core' ? coreSubtopics : extendedSubtopics
    return subtopics.filter(subtopic => subtopic.topic_id === topicId)
  }

  const handleSubtopicAction = async (subtopic: EnhancedSubtopic, action: string) => {
    try {
      console.log(`Starting ${action} for subtopic:`, subtopic.title)
      
      // For now, just show an alert - we'll implement actual quiz generation later
      if (action === 'assessment') {
        alert(`Assessment quiz for ${subtopic.title} - Coming Soon!`)
      } else if (action === 'practice') {
        alert(`Practice quiz for ${subtopic.title} - Coming Soon!`)
      } else if (action === 'mastery') {
        alert(`Mastery quiz for ${subtopic.title} - Coming Soon!`)
      }
      
      onTopicSelect(subtopic.topic_id, subtopic.id)
    } catch (error) {
      console.error('Error with subtopic action:', error)
    }
  }

  const getMasteryColor = (level: MasteryLevel) => {
    switch (level) {
      case 'Mastery': return 'text-green-600 bg-green-100 border-green-200'
      case 'Proficient': return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'Approaching': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'Developing': return 'text-orange-600 bg-orange-100 border-orange-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getMasteryIcon = (level: MasteryLevel) => {
    switch (level) {
      case 'Mastery': return <Trophy className="h-4 w-4" />
      case 'Proficient': return <CheckCircle2 className="h-4 w-4" />
      case 'Approaching': return <Target className="h-4 w-4" />
      case 'Developing': return <BarChart3 className="h-4 w-4" />
      default: return <Play className="h-4 w-4" />
    }
  }

  const renderActionButton = (subtopic: EnhancedSubtopic) => {
    const masteryLevel: MasteryLevel = 'Unassessed' // Default for now
    const questionCount = subtopic.questionAvailability?.total || 0

    if (questionCount === 0) {
      return (
        <Badge variant="outline" className="text-xs text-gray-500">
          No Questions Available
        </Badge>
      )
    }

    // For now, just show "Take Assessment" for all subtopics
    return (
      <Button
        size="sm"
        onClick={() => handleSubtopicAction(subtopic, 'assessment')}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Target className="h-4 w-4 mr-1" />
        Take Assessment ({questionCount}Q)
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your learning progress...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Error loading progress</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button 
            onClick={fetchTopicsAndProgress}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const getTotalSubtopics = (level: 'Core' | 'Extended') => {
    return level === 'Core' ? coreSubtopics.length : extendedSubtopics.length
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          IGCSE Mathematics Quiz Practice
        </h1>
        <p className="text-gray-600 mb-6">
          Select a topic or specific subtopic to practice. All questions are aligned with Cambridge IGCSE 0580 syllabus.
        </p>

        {/* Statistics */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="text-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full inline-block mr-2"></div>
            <span className="text-sm font-medium">9 Core Topics</span>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-green-500 rounded-full inline-block mr-2"></div>
            <span className="text-sm font-medium">{getTotalSubtopics('Core')}+ Core Subtopics</span>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full inline-block mr-2"></div>
            <span className="text-sm font-medium">{getTotalSubtopics('Extended')}+ Extended Subtopics</span>
          </div>
        </div>

        {/* Navigation Link to Syllabus */}
        <div className="mb-6">
          <Link href="/syllabus">
            <Button variant="outline" className="inline-flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>View Complete Syllabus Breakdown</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="space-y-4">
        {topics.map((topic) => {
          const coreCount = getSubtopicsForTopic(topic.id, 'Core').length
          const extendedCount = getSubtopicsForTopic(topic.id, 'Extended').length
          const isExpanded = expandedTopic === topic.id

          return (
            <Card 
              key={topic.id} 
              className="transition-all duration-200 hover:shadow-md overflow-hidden"
              style={{ borderLeft: `4px solid ${topic.color}` }}
            >
              <CardHeader
                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                className="pb-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: topic.color }}
                    >
                      {topic.topic_number}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {topic.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {coreCount} Core
                    </Badge>
                    {extendedCount > 0 && userPath === 'Extended' && (
                      <Badge variant="outline" className="text-xs">
                        +{extendedCount} Extended
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  {/* Core Subtopics */}
                  {coreCount > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-blue-700 mb-3 text-sm">
                        Core Subtopics ({coreCount})
                      </h4>
                      <div className="space-y-3">
                        {getSubtopicsForTopic(topic.id, 'Core').map((subtopic) => (
                          <div
                            key={subtopic.id}
                            className="p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {subtopic.subtopic_code}
                                </Badge>
                                <span className="font-medium text-gray-900">
                                  {subtopic.title}
                                </span>
                              </div>
                              {renderActionButton(subtopic)}
                            </div>
                            <p className="text-sm text-gray-600">{subtopic.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extended Subtopics */}
                  {extendedCount > 0 && userPath === 'Extended' && (
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-3 text-sm">
                        Extended Addition ({extendedCount})
                      </h4>
                      <div className="space-y-3">
                        {getSubtopicsForTopic(topic.id, 'Extended').map((subtopic) => (
                          <div
                            key={subtopic.id}
                            className="p-4 rounded-lg border bg-purple-50 hover:bg-purple-100 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs font-mono">
                                  {subtopic.subtopic_code}
                                </Badge>
                                <span className="font-medium text-gray-900">
                                  {subtopic.title}
                                </span>
                                <Badge variant="secondary" className="text-xs">Extended</Badge>
                              </div>
                              {renderActionButton(subtopic)}
                            </div>
                            <p className="text-sm text-gray-600">{subtopic.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
