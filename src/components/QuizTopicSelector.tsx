"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Target, BookOpen, Play } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  const [coreSubtopics, setCoreSubtopics] = useState<IGCSESubtopic[]>([])
  const [extendedSubtopics, setExtendedSubtopics] = useState<IGCSESubtopic[]>([])
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopicsAndSubtopics()
  }, [])

  const fetchTopicsAndSubtopics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('topic_number', { ascending: true })

      if (topicsError) throw topicsError

      // Fetch core subtopics
      const { data: coreData, error: coreError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('difficulty_level', 'Core')
        .order('subtopic_code', { ascending: true })

      if (coreError) throw coreError

      // Fetch extended subtopics
      const { data: extendedData, error: extendedError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('difficulty_level', 'Extended')
        .order('subtopic_code', { ascending: true })

      if (extendedError) throw extendedError

      setTopics(topicsData || [])
      setCoreSubtopics(coreData || [])
      setExtendedSubtopics(extendedData || [])
      
      console.log('Loaded topics:', topicsData?.length)
      console.log('Loaded core subtopics:', coreData?.length)
      console.log('Loaded extended subtopics:', extendedData?.length)

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

  const handleTopicClick = (topic: IGCSETopic) => {
    if (expandedTopic === topic.id) {
      setExpandedTopic(null)
    } else {
      setExpandedTopic(topic.id)
    }
    setSelectedTopic(topic.id)
    setSelectedSubtopic('')
    onTopicSelect(topic.id)
  }

  const handleSubtopicClick = (topic: IGCSETopic, subtopic: IGCSESubtopic) => {
    setSelectedTopic(topic.id)
    setSelectedSubtopic(subtopic.id)
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
        <p className="text-gray-600 mb-4">No topics available</p>
        <button 
          onClick={fetchTopicsAndSubtopics}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Reload Topics
        </button>
      </div>
    )
  }

  const getTotalSubtopics = (level: 'Core' | 'Extended') => {
    return level === 'Core' ? coreSubtopics.length : extendedSubtopics.length
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Match Syllabus Page */}
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

      {/* Selection Status */}
      {selectedTopic && (
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Ready to Practice!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected for practice:</p>
                <p className="font-medium">
                  {topics.find(t => t.id === selectedTopic)?.title}
                  {selectedSubtopic && (
                    <span className="text-blue-600">
                      {" → " + [...coreSubtopics, ...extendedSubtopics].find(s => s.id === selectedSubtopic)?.title}
                    </span>
                  )}
                </p>
              </div>
              <Button className="inline-flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span>Start Quiz</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics Grid */}
      <div className="space-y-4">
        {topics.map((topic) => {
          const coreCount = getSubtopicsForTopic(topic.id, 'Core').length
          const extendedCount = getSubtopicsForTopic(topic.id, 'Extended').length
          const isExpanded = expandedTopic === topic.id
          const isSelected = selectedTopic === topic.id

          return (
            <Card 
              key={topic.id} 
              className={`transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden ${
                isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
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
                      {coreCount} Core
                    </Badge>
                    {extendedCount > 0 && (
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
                      <div className="space-y-2 pl-4 border-l-2 ml-1" style={{ borderColor: topic.color + '40' }}>
                        {getSubtopicsForTopic(topic.id, 'Core').map((subtopic) => (
                          <div
                            key={subtopic.id}
                            onClick={() => handleSubtopicClick(topic, subtopic)}
                            className={`p-3 rounded-lg transition-colors cursor-pointer group ${
                              selectedSubtopic === subtopic.id 
                                ? 'bg-blue-100 border border-blue-300' 
                                : 'hover:bg-gray-50'
                            }`}
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
                    </div>
                  )}

                  {/* Extended Subtopics */}
                  {extendedCount > 0 && (
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-3 text-sm">
                        Extended Addition ({extendedCount})
                      </h4>
                      <div className="space-y-2 pl-4 border-l-2 ml-1" style={{ borderColor: topic.color + '40' }}>
                        {getSubtopicsForTopic(topic.id, 'Extended').map((subtopic) => (
                          <div
                            key={subtopic.id}
                            onClick={() => handleSubtopicClick(topic, subtopic)}
                            className={`p-3 rounded-lg transition-colors cursor-pointer group ${
                              selectedSubtopic === subtopic.id 
                                ? 'bg-purple-100 border border-purple-300' 
                                : 'hover:bg-purple-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {subtopic.subtopic_code}
                                  </Badge>
                                  <span className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                                    {subtopic.title}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">Extended</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 ml-16">
                                  {subtopic.description}
                                </p>
                              </div>
                              <Target className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                            </div>
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
