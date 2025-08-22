"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, BookOpen, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface IGCSETopic {
  id: string
  topic_number: number
  title: string
  description: string
  color: string
  created_at: string
  updated_at: string
}

interface IGCSESubtopic {
  id: string
  topic_id: string
  subtopic_code: string
  title: string
  description: string
  difficulty_level: string
  created_at: string
  updated_at: string
}

interface QuizTopicSelectorProps {
  onTopicSelect: (topicId: string, subtopicId?: string) => void
}

export default function QuizTopicSelector({ onTopicSelect }: QuizTopicSelectorProps) {
  const [topics, setTopics] = useState<IGCSETopic[]>([])
  const [subtopics, setSubtopics] = useState<IGCSESubtopic[]>([])
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopicsAndSubtopics()
  }, [])

  const fetchTopicsAndSubtopics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch topics - ordered by topic_number
      const { data: topicsData, error: topicsError } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('topic_number', { ascending: true })

      if (topicsError) {
        console.error('Topics fetch error:', topicsError)
        throw topicsError
      }

      // Fetch subtopics - ordered by subtopic_code
      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('difficulty_level', 'Core')
        .order('subtopic_code', { ascending: true })

      if (subtopicsError) {
        console.error('Subtopics fetch error:', subtopicsError)
        throw subtopicsError
      }

      setTopics(topicsData || [])
      setSubtopics(subtopicsData || [])
      
      console.log('Loaded topics:', topicsData?.length)
      console.log('Loaded subtopics:', subtopicsData?.length)

    } catch (error) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  const getSubtopicsForTopic = (topicId: string) => {
    return subtopics.filter(subtopic => subtopic.topic_id === topicId)
  }

  const handleTopicClick = (topic: IGCSETopic) => {
    if (expandedTopic === topic.id) {
      setExpandedTopic(null)
    } else {
      setExpandedTopic(topic.id)
    }
    onTopicSelect(topic.id)
  }

  const handleSubtopicClick = (topic: IGCSETopic, subtopic: IGCSESubtopic) => {
    onTopicSelect(topic.id, subtopic.id)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading IGCSE topics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 font-medium">Error loading topics</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button 
            onClick={fetchTopicsAndSubtopics}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No topics available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Quiz Topic</h2>
        <p className="text-gray-600">Select a topic or specific subtopic to practice</p>
      </div>

      <div className="grid gap-4">
        {topics.map((topic) => {
          const topicSubtopics = getSubtopicsForTopic(topic.id)
          const isExpanded = expandedTopic === topic.id

          return (
            <Card 
              key={topic.id} 
              className="transition-all duration-200 hover:shadow-md cursor-pointer"
              style={{ borderLeft: `4px solid ${topic.color}` }}
            >
              <CardHeader
                onClick={() => handleTopicClick(topic)}
                className="pb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: topic.color }}
                    >
                      {topic.topic_number}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {topic.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {topicSubtopics.length} subtopics
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && topicSubtopics.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2 pl-4 border-l-2 ml-5" style={{ borderColor: topic.color + '40' }}>
                    {topicSubtopics.map((subtopic) => (
                      <div
                        key={subtopic.id}
                        onClick={() => handleSubtopicClick(topic, subtopic)}
                        className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {subtopic.subtopic_code}
                              </Badge>
                              <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {subtopic.title}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 ml-16">
                              {subtopic.description}
                            </p>
                          </div>
                          <Target className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))}
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