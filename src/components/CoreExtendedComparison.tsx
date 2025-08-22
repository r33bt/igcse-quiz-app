"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Plus, Target, BookOpen } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export default function CoreExtendedComparison() {
  const [topics, setTopics] = useState<IGCSETopic[]>([])
  const [coreSubtopics, setCoreSubtopics] = useState<IGCSESubtopic[]>([])
  const [extendedSubtopics, setExtendedSubtopics] = useState<IGCSESubtopic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'comparison' | 'core' | 'extended'>('comparison')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

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

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSubtopicsForTopic = (topicId: string, level: 'Core' | 'Extended') => {
    const subtopics = level === 'Core' ? coreSubtopics : extendedSubtopics
    return subtopics.filter(subtopic => subtopic.topic_id === topicId)
  }

  const getTotalSubtopics = (level: 'Core' | 'Extended') => {
    return level === 'Core' ? coreSubtopics.length : extendedSubtopics.length
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading syllabus comparison...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Cambridge IGCSE Mathematics 0580 Syllabus
        </h1>
        <p className="text-gray-600 mb-6">
          Complete Core syllabus breakdown for 2025-2027. Click on any topic to explore subtopics and learning objectives.
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
      </div>

      {/* Paper Selection Guide */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Which Paper Should You Choose?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-700 mb-2">Core Paper (Grades C-G)</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Covers fundamental mathematics concepts</li>
                <li>• Suitable for students targeting grades C-G</li>
                <li>• {getTotalSubtopics('Core')} essential subtopics</li>
                <li>• Good foundation for further mathematics study</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-purple-700 mb-2">Extended Paper (Grades A*-E)</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Includes all Core topics plus advanced content</li>
                <li>• Suitable for students targeting grades A*-E</li>
                <li>• {getTotalSubtopics('Core') + getTotalSubtopics('Extended')} total subtopics</li>
                <li>• Preparation for A-Level mathematics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Side-by-Side Comparison</TabsTrigger>
          <TabsTrigger value="core">Core Only</TabsTrigger>
          <TabsTrigger value="extended">Extended Only</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-6">
          <div className="space-y-4">
            {topics.map((topic) => {
              const coreCount = getSubtopicsForTopic(topic.id, 'Core').length
              const extendedCount = getSubtopicsForTopic(topic.id, 'Extended').length

              return (
                <Card key={topic.id} className="overflow-hidden">
                  <CardHeader style={{ borderLeft: `4px solid ${topic.color}` }}>
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
                          <CardDescription>{topic.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="secondary">{coreCount} Core</Badge>
                        <Badge variant="outline">{extendedCount} Extended</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2">
                      {/* Core Column */}
                      <div className="p-4 bg-blue-50 border-r">
                        <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Core Subtopics ({coreCount})
                        </h4>
                        <div className="space-y-2">
                          {getSubtopicsForTopic(topic.id, 'Core').map((subtopic) => (
                            <div key={subtopic.id} className="bg-white rounded p-2 text-sm">
                              <div className="flex items-start space-x-2">
                                <Badge variant="outline" className="text-xs font-mono shrink-0">
                                  {subtopic.subtopic_code}
                                </Badge>
                                <div>
                                  <p className="font-medium">{subtopic.title}</p>
                                  <p className="text-gray-600 text-xs mt-1">{subtopic.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Extended Column */}
                      <div className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-700 mb-3 flex items-center">
                          <Plus className="h-4 w-4 mr-2" />
                          Extended Addition ({extendedCount})
                        </h4>
                        <div className="space-y-2">
                          {getSubtopicsForTopic(topic.id, 'Extended').map((subtopic) => (
                            <div key={subtopic.id} className="bg-white rounded p-2 text-sm">
                              <div className="flex items-start space-x-2">
                                <Badge variant="outline" className="text-xs font-mono shrink-0">
                                  {subtopic.subtopic_code}
                                </Badge>
                                <div>
                                  <p className="font-medium">{subtopic.title}</p>
                                  <p className="text-gray-600 text-xs mt-1">{subtopic.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {extendedCount === 0 && (
                            <p className="text-gray-500 italic text-sm">No additional content for Extended paper</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="core" className="mt-6">
          <div className="grid gap-4">
            {topics.map((topic) => (
              <Card key={topic.id} style={{ borderLeft: `4px solid ${topic.color}` }}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: topic.color }}
                    >
                      {topic.topic_number}
                    </div>
                    <span>{topic.title}</span>
                    <Badge variant="secondary">{getSubtopicsForTopic(topic.id, 'Core').length} subtopics</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {getSubtopicsForTopic(topic.id, 'Core').map((subtopic) => (
                      <div key={subtopic.id} className="flex items-start space-x-2 p-2 rounded bg-gray-50">
                        <Badge variant="outline" className="text-xs font-mono shrink-0">
                          {subtopic.subtopic_code}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{subtopic.title}</p>
                          <p className="text-gray-600 text-xs">{subtopic.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="extended" className="mt-6">
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Extended Paper includes all Core content plus the additional topics shown below.</strong>
            </p>
          </div>
          <div className="grid gap-4">
            {topics.map((topic) => {
              const extendedSubs = getSubtopicsForTopic(topic.id, 'Extended')
              return (
                <Card key={topic.id} style={{ borderLeft: `4px solid ${topic.color}` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: topic.color }}
                      >
                        {topic.topic_number}
                      </div>
                      <span>{topic.title}</span>
                      <Badge variant="outline">{extendedSubs.length} additional</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {extendedSubs.length > 0 ? (
                      <div className="grid gap-2">
                        {extendedSubs.map((subtopic) => (
                          <div key={subtopic.id} className="flex items-start space-x-2 p-2 rounded bg-purple-50">
                            <Badge variant="outline" className="text-xs font-mono shrink-0">
                              {subtopic.subtopic_code}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">{subtopic.title}</p>
                              <p className="text-gray-600 text-xs">{subtopic.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No additional Extended content for this topic</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
