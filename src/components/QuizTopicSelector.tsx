"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
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

export default function QuizTopicSelector() {
  const [topics, setTopics] = useState<IGCSETopic[]>([])
  const [subtopics, setSubtopics] = useState<Record<string, IGCSESubtopic[]>>({})
  const [progress, setProgress] = useState<Record<string, SubtopicProgress>>({})
  const [loading, setLoading] = useState(true)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [selectedPath, setSelectedPath] = useState<'Core' | 'Extended'>('Core')

  const loadTopicsAndSubtopics = async () => {
    try {
      setLoading(true)

      // Load topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('topic_number')

      if (topicsError) throw topicsError

      // Load subtopics filtered by Core/Extended
      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('difficulty_level', selectedPath)
        .order('subtopic_code')

      if (subtopicsError) throw subtopicsError

      // Group subtopics by topic
      const subtopicsByTopic = (subtopicsData || []).reduce((acc, subtopic) => {
        if (!acc[subtopic.topic_id]) {
          acc[subtopic.topic_id] = []
        }
        acc[subtopic.topic_id].push({
          id: subtopic.id,
          topic_id: subtopic.topic_id,
          subtopic_code: subtopic.subtopic_code,
          title: subtopic.title,
          description: subtopic.description || '',
          paper_type: subtopic.difficulty_level as 'Core' | 'Extended'
        })
        return acc
      }, {} as Record<string, IGCSESubtopic[]>)

      setTopics(topicsData || [])
      setSubtopics(subtopicsByTopic)

      // Load user progress
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user || { id: "a1b2c3d4-e5f6-7890-1234-567890abcdef" }
      
      if (!user) return

      // Fix: Explicitly type the subtopic items
      const allSubtopics = Object.values(subtopicsByTopic).flat() as IGCSESubtopic[]
      const subtopicIds = allSubtopics.map(subtopic => subtopic.id)
      
      const { data: progressData, error } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('subtopic_id', subtopicIds)

      if (error) {
        console.error('Error loading progress:', error)
        return
      }

      const progressBySubtopic = (progressData || []).reduce((acc, item) => {
        acc[item.subtopic_id] = item
        return acc
      }, {} as Record<string, SubtopicProgress>)

      setProgress(progressBySubtopic)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopicsAndSubtopics()
  }, [selectedPath])

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

  const getOverallProgress = () => {
    const allSubtopics = Object.values(subtopics).flat()
    const masteredCount = allSubtopics.filter(s => 
      progress[s.id]?.mastery_level === 'Mastery' || progress[s.id]?.mastery_level === 'Proficient'
    ).length

    return {
      percentage: allSubtopics.length > 0 ? Math.round((masteredCount / allSubtopics.length) * 100) : 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IGCSE Topics...</p>
        </div>
      </div>
    )
  }

  const overallProgress = getOverallProgress()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">IGCSE Mathematics Topics</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore and master all IGCSE Mathematics topics. Track your progress and identify areas for improvement.
        </p>
        
        {/* Path Selection */}
        <div className="flex justify-center gap-2">
          <Button
            variant={selectedPath === 'Core' ? 'default' : 'outline'}
            onClick={() => setSelectedPath('Core')}
            size="sm"
          >
            Core Topics
          </Button>
          <Button
            variant={selectedPath === 'Extended' ? 'default' : 'outline'}
            onClick={() => setSelectedPath('Extended')}
            size="sm"
          >
            Extended Topics
          </Button>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-600 mb-2">Overall Progress</div>
          <div className="text-2xl font-bold text-blue-600">{overallProgress.percentage}%</div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topics.map((topic) => {
          const topicSubtopics = subtopics[topic.id] || []
          const isExpanded = expandedTopics.has(topic.id)

          return (
            <Card key={topic.id} className="border-l-4" style={{ borderLeftColor: topic.color }}>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => toggleTopic(topic.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: topic.color }}
                    >
                      {topic.topic_number}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      <CardDescription>{topic.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {topicSubtopics.length} {selectedPath} Subtopics
                    </Badge>
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
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {selectedPath} Subtopics ({topicSubtopics.length})
                    </h4>
                    {topicSubtopics.map((subtopic) => {
                      const subtopicProgress = progress[subtopic.id]
                      const availability = {
                        total: 10,
                        byDifficulty: { easy: 3, medium: 4, hard: 3 },
                        byCategory: { core: 6, extended: 4 },
                        baselineReady: 10
                      }

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

      {/* View Complete Syllabus Button */}
      <div className="text-center pt-6">
        <Button variant="outline" size="lg">
          <BookOpen className="h-5 w-5 mr-2" />
          View Complete Syllabus Breakdown
        </Button>
      </div>
    </div>
  )
}
