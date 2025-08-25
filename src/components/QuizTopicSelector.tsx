"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Star, Sparkles } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import SubtopicProgressCard from './SubtopicProgressCard'

interface Topic {
  id: string
  topic_number: number
  title: string
  description: string
  color: string
}

interface Subtopic {
  id: string
  subtopic_code: string
  title: string
  description: string
  difficulty_level: string
  topic_id: string
}

interface UserProgress {
  id: string
  user_id: string
  subtopic_id: string
  questions_attempted: number
  questions_correct: number
  mastery_percentage: number
  current_mastery_level: string
  easy_questions_attempted: number
  easy_questions_correct: number
  medium_questions_attempted: number
  medium_questions_correct: number
  hard_questions_attempted: number
  hard_questions_correct: number
  core_questions_attempted: number
  core_questions_correct: number
  extended_questions_attempted: number
  extended_questions_correct: number
  baseline_assessment_completed: boolean
  baseline_score: number | null
  last_practiced: string | null
}

export default function QuizTopicSelector() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [completedSubtopicId, setCompletedSubtopicId] = useState<string | null>(null)
  const [completionData, setCompletionData] = useState<{
    type: string
    focus?: string
    path?: string
  } | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
    handleCompletionParameters()
  }, [])

  const handleCompletionParameters = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const expandedId = urlParams.get('expanded')
      const completed = urlParams.get('completed')
      const focus = urlParams.get('focus')
      const path = urlParams.get('path')
      
      if (expandedId && completed) {
        setCompletedSubtopicId(expandedId)
        setCompletionData({
          type: completed,
          focus: focus || undefined,
          path: path || undefined
        })
        
        // Delay to ensure DOM is ready, then scroll to completed subtopic
        setTimeout(() => scrollToCompletedSubtopic(expandedId), 1500)
      }
    }
  }

  const scrollToCompletedSubtopic = async (subtopicId: string) => {
    try {
      // Find which topic contains this subtopic
      const { data: subtopic } = await supabase
        .from('igcse_subtopics')
        .select('topic_id, igcse_topics!inner(topic_number)')
        .eq('id', subtopicId)
        .single()

      if (subtopic && subtopic.igcse_topics) {
        // Expand the topic first
        setExpandedTopics(prev => new Set([...prev, subtopic.topic_id]))
        
        // Wait for expansion, then scroll directly to the completed subtopic card
        setTimeout(() => {
          const subtopicElement = document.querySelector(`[data-subtopic-id="${subtopicId}"]`)
          if (subtopicElement) {
            subtopicElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center'
            })
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error finding topic for subtopic:', error)
    }
  }

  const loadData = async () => {
    try {
      // Load topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('topic_number')

      if (topicsError) throw topicsError
      setTopics(topicsData || [])

      // Load subtopics
      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .order('subtopic_code')

      if (subtopicsError) throw subtopicsError
      setSubtopics(subtopicsData || [])

      // Load user progress (using test user)
      const testUserId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
      const { data: progressData, error: progressError } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', testUserId)

      if (progressError) throw progressError
      setUserProgress(progressData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      return newSet
    })
  }

  const getSubtopicsForTopic = (topicId: string) => {
    return subtopics.filter(subtopic => subtopic.topic_id === topicId)
  }

  const getProgressStats = () => {
    const totalSubtopics = subtopics.length
    const startedSubtopics = userProgress.filter(p => p.questions_attempted > 0).length
    const masteredSubtopics = userProgress.filter(p => p.current_mastery_level === 'Mastery').length
    
    return {
      total: totalSubtopics,
      started: startedSubtopics,
      mastered: masteredSubtopics
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IGCSE Mathematics Topics...</p>
        </div>
      </div>
    )
  }

  const stats = getProgressStats()

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          IGCSE Mathematics Learning Hub
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Master the complete Cambridge IGCSE Mathematics syllabus with our intelligent
          assessment system. Track your progress across all topics and difficulty levels.
        </p>
        
        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Core Topics</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{subtopics.length}</div>
              <div className="text-sm text-gray-600">Subtopics</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.started}</div>
              <div className="text-sm text-gray-600">Started</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.mastered}</div>
              <div className="text-sm text-gray-600">Mastered</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topics.map(topic => {
          const topicSubtopics = getSubtopicsForTopic(topic.id)
          const isExpanded = expandedTopics.has(topic.id)
          
          return (
            <Card key={topic.id} className="overflow-hidden" data-topic-number={topic.topic_number}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-12 rounded-lg"
                      style={{ backgroundColor: topic.color }}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {topic.topic_number}. {topic.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {topic.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-gray-600">
                      {topicSubtopics.length} subtopics
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTopic(topic.id)}
                      className="p-2"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {topicSubtopics.map(subtopic => {
                      const progress = userProgress.find(p => p.subtopic_id === subtopic.id)
                      const isJustCompleted = completedSubtopicId === subtopic.id
                      
                      return (
                        <div 
                          key={subtopic.id} 
                          data-subtopic-id={subtopic.id}
                          className={`relative transition-all duration-700 ${
                            isJustCompleted 
                              ? 'ring-4 ring-green-400 shadow-lg shadow-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg' 
                              : ''
                          }`}
                        >
                          {isJustCompleted && (
                            <div className="absolute -top-2 -right-2 z-10">
                              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                                <Sparkles className="h-3 w-3" />
                                JUST COMPLETED!
                              </div>
                            </div>
                          )}
                          
                          {isJustCompleted && (
                            <div className="mb-3 mx-4 pt-4">
                              <div className="bg-green-100 border-l-4 border-green-500 px-4 py-3 rounded-r-lg">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <Star className="h-5 w-5 text-green-500" />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">
                                      🎉 Great job! You completed a {completionData?.type?.toUpperCase()} quiz
                                      {completionData?.focus && ` focusing on ${completionData.focus.toUpperCase()} questions`}
                                      {completionData?.path && ` for ${completionData.path.toUpperCase()} paper`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className={isJustCompleted ? 'mx-4 pb-4' : ''}>
                            <SubtopicProgressCard
                              subtopic={subtopic}
                              progress={progress || null}
                            />
                          </div>
                        </div>
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
  )
}
