"use client"

import { useState, useEffect } from 'react'
import { IGCSETopic, IGCSESubtopic } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface QuizTopicSelectorProps {
  onTopicSelect: (topicId: string, subtopicId?: string) => void
}

export default function QuizTopicSelector({ onTopicSelect }: QuizTopicSelectorProps) {
  const [topics, setTopics] = useState<IGCSETopic[]>([])
  const [subtopics, setSubtopics] = useState<Record<string, IGCSESubtopic[]>>({})
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const { data: topicsData } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('order_index')

      const { data: subtopicsData } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('paper_type', 'Core')
        .order('order_index')

      if (topicsData && subtopicsData) {
        setTopics(topicsData)
        
        // Group subtopics by topic_id
        const grouped = subtopicsData.reduce((acc, subtopic) => {
          if (!acc[subtopic.topic_id]) acc[subtopic.topic_id] = []
          acc[subtopic.topic_id].push(subtopic)
          return acc
        }, {} as Record<string, IGCSESubtopic[]>)
        
        setSubtopics(grouped)
      }
    } catch (error) {
      console.error('Error loading topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(selectedTopic === topicId ? null : topicId)
  }

  if (loading) {
    return <div className="text-center py-8">Loading topics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Quiz Topic</h2>
        <p className="text-gray-600">Select a topic or specific subtopic to practice</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Card key={topic.id} className="hover:shadow-lg transition-shadow">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => handleTopicClick(topic.id)}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: topic.color }}
                >
                  {topic.code}
                </div>
                <div>
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {subtopics[topic.id]?.length || 0} subtopics
                  </p>
                </div>
              </div>
            </CardHeader>

            {selectedTopic === topic.id && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <button
                    onClick={() => onTopicSelect(topic.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors mb-3"
                  >
                    🎯 Practice All {topic.name}
                  </button>
                  
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Or choose specific subtopic:</p>
                    <div className="space-y-1">
                      {subtopics[topic.id]?.map((subtopic) => (
                        <button
                          key={subtopic.id}
                          onClick={() => onTopicSelect(topic.id, subtopic.id)}
                          className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">{subtopic.code}</Badge>
                            <span>{subtopic.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
