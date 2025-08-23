"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, ChevronRight, Target, BookOpen, Play, BarChart3, Trophy, CheckCircle2, RefreshCw, TrendingUp, Clock, Award } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
// import Link from 'next/link' // Removed - not used in this component

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  paper_type: 'Core' | 'Extended'
}

interface SubtopicProgress {
  subtopic_id: string
  user_id: string
  mastery_level: MasteryLevel
  mastery_percentage: number
  questions_attempted: number
  questions_correct: number
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
  last_practiced: string | null
}

interface QuestionAvailability {
  total: number
  byDifficulty: { easy: number, medium: number, hard: number }
  byCategory: { core: number, extended: number }
  baselineReady: number
}

interface PerformanceAnalysis {
  strengths: string[]
  weaknesses: string[]
  easyAccuracy: number
  mediumAccuracy: number
  hardAccuracy: number
  coreAccuracy: number
  extendedAccuracy: number
}

export default function QuizTopicSelector() {
  const [topics, setTopics] = useState<IGCSETopic[]>([])
  const [subtopics, setSubtopics] = useState<Record<string, IGCSESubtopic[]>>({})
  const [progress, setProgress] = useState<Record<string, SubtopicProgress>>({})
  const [questionAvailability, setQuestionAvailability] = useState<Record<string, QuestionAvailability>>({})
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [selectedPath, setSelectedPath] = useState<'Core' | 'Extended'>('Core')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopicsAndSubtopics()
  }, [selectedPath])

  const loadTopicsAndSubtopics = async () => {
    try {
      setLoading(true)

      // Load topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('igcse_topics')
        .select('*')
        .order('topic_number')

      if (topicsError) throw topicsError

      const formattedTopics = topicsData.map(topic => ({
        id: topic.id,
        topic_number: topic.topic_number,
        title: topic.title,
        description: topic.description || '',
        color: topic.color || '#3B82F6'
      }))

      setTopics(formattedTopics)

      // Load subtopics grouped by topic
      const { data: subtopicsData, error: subtopicsError } = await supabase
        .from('igcse_subtopics')
        .select('*')
        .eq('difficulty_level', selectedPath)
        .order('subtopic_code')

      if (subtopicsError) throw subtopicsError

      const subtopicsByTopic = subtopicsData.reduce((acc, subtopic) => {
        const topicId = subtopic.topic_id
        if (!acc[topicId]) acc[topicId] = []
        acc[topicId].push({
          id: subtopic.id,
          topic_id: subtopic.topic_id,
          subtopic_code: subtopic.subtopic_code,
          title: subtopic.title,
          description: subtopic.description || '',
          paper_type: subtopic.difficulty_level as 'Core' | 'Extended'
        })
        return acc
      }, {} as Record<string, IGCSESubtopic[]>)

      setSubtopics(subtopicsByTopic)

      // Load user progress and question availability
      await loadUserProgress(subtopicsData.map(s => s.id))
      await loadQuestionAvailability(subtopicsData.map(s => s.id))

    } catch (error) {
      console.error('Error loading topics and subtopics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProgress = async (subtopicIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
    console.log('?? DEBUG: Current user:', user?.id) // TEMP DEBUG
      if (!user) return

      const { data: progressData, error } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('subtopic_id', subtopicIds)

    console.log('?? DEBUG: Progress data loaded:', progressData) // TEMP DEBUG
    console.log('?? DEBUG: Any errors:', error) // TEMP DEBUG

      if (error) throw error

      const progressMap: Record<string, SubtopicProgress> = {}
      progressData?.forEach(p => {
        progressMap[p.subtopic_id] = {
          subtopic_id: p.subtopic_id,
          user_id: p.user_id,
          mastery_level: p.current_mastery_level || 'Unassessed',
          mastery_percentage: p.mastery_percentage || 0,
          questions_attempted: p.questions_attempted || 0,
          questions_correct: p.questions_correct || 0,
          core_questions_attempted: p.core_questions_attempted || 0,
          core_questions_correct: p.core_questions_correct || 0,
          extended_questions_attempted: p.extended_questions_attempted || 0,
          extended_questions_correct: p.extended_questions_correct || 0,
          easy_questions_attempted: p.easy_questions_attempted || 0,
          easy_questions_correct: p.easy_questions_correct || 0,
          medium_questions_attempted: p.medium_questions_attempted || 0,
          medium_questions_correct: p.medium_questions_correct || 0,
          hard_questions_attempted: p.hard_questions_attempted || 0,
          hard_questions_correct: p.hard_questions_correct || 0,
          baseline_assessment_completed: p.baseline_assessment_completed || false,
          last_practiced: p.last_practiced
        }
      })

      setProgress(progressMap)
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  const loadQuestionAvailability = async (subtopicIds: string[]) => {
    try {
      const { data: questionsData, error } = await supabase
        .from('question_selection_helper')
        .select('igcse_subtopic_id, difficulty, question_category, is_baseline_question')
        .in('igcse_subtopic_id', subtopicIds)

      if (error) throw error

      const availabilityMap: Record<string, QuestionAvailability> = {}
      
      subtopicIds.forEach(subtopicId => {
        const subtopicQuestions = questionsData?.filter(q => q.igcse_subtopic_id === subtopicId) || []
        
        availabilityMap[subtopicId] = {
          total: subtopicQuestions.length,
          byDifficulty: {
            easy: subtopicQuestions.filter(q => q.difficulty === 1).length,
            medium: subtopicQuestions.filter(q => q.difficulty === 2).length,
            hard: subtopicQuestions.filter(q => q.difficulty >= 3).length
          },
          byCategory: {
            core: subtopicQuestions.filter(q => q.question_category === 'Core').length,
            extended: subtopicQuestions.filter(q => q.question_category === 'Extended').length
          },
          baselineReady: subtopicQuestions.filter(q => q.is_baseline_question).length
        }
      })

      setQuestionAvailability(availabilityMap)
    } catch (error) {
      console.error('Error loading question availability:', error)
    }
  }

  const analyzePerformance = (subtopicProgress: SubtopicProgress): PerformanceAnalysis => {
    const easyAccuracy = subtopicProgress.easy_questions_attempted > 0 
      ? (subtopicProgress.easy_questions_correct / subtopicProgress.easy_questions_attempted) * 100 
      : 0

    const mediumAccuracy = subtopicProgress.medium_questions_attempted > 0 
      ? (subtopicProgress.medium_questions_correct / subtopicProgress.medium_questions_attempted) * 100 
      : 0

    const hardAccuracy = subtopicProgress.hard_questions_attempted > 0 
      ? (subtopicProgress.hard_questions_correct / subtopicProgress.hard_questions_attempted) * 100 
      : 0

    const coreAccuracy = subtopicProgress.core_questions_attempted > 0 
      ? (subtopicProgress.core_questions_correct / subtopicProgress.core_questions_attempted) * 100 
      : 0

    const extendedAccuracy = subtopicProgress.extended_questions_attempted > 0 
      ? (subtopicProgress.extended_questions_correct / subtopicProgress.extended_questions_attempted) * 100 
      : 0

    const strengths: string[] = []
    const weaknesses: string[] = []

    if (easyAccuracy >= 80) strengths.push('Strong foundations')
    else if (easyAccuracy < 60 && subtopicProgress.easy_questions_attempted > 0) weaknesses.push('Basic concepts need review')

    if (mediumAccuracy >= 75) strengths.push('Good problem-solving')
    else if (mediumAccuracy < 60 && subtopicProgress.medium_questions_attempted > 0) weaknesses.push('Application skills need work')

    if (hardAccuracy >= 70) strengths.push('Excellent at complex problems')
    else if (hardAccuracy < 50 && subtopicProgress.hard_questions_attempted > 0) weaknesses.push('Challenging concepts need focus')

    if (selectedPath === 'Extended' && extendedAccuracy >= 70) strengths.push('Strong extended content')
    else if (selectedPath === 'Extended' && extendedAccuracy < 50 && subtopicProgress.extended_questions_attempted > 0) {
      weaknesses.push('Extended topics need practice')
    }

    return {
      strengths,
      weaknesses,
      easyAccuracy: Math.round(easyAccuracy),
      mediumAccuracy: Math.round(mediumAccuracy),
      hardAccuracy: Math.round(hardAccuracy),
      coreAccuracy: Math.round(coreAccuracy),
      extendedAccuracy: Math.round(extendedAccuracy)
    }
  }

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopics(newExpanded)
  }

  const getMasteryColor = (level: MasteryLevel): string => {
    switch (level) {
      case 'Mastery': return 'text-green-700 bg-green-100 border-green-200'
      case 'Proficient': return 'text-blue-700 bg-blue-100 border-blue-200' 
      case 'Approaching': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'Developing': return 'text-orange-700 bg-orange-100 border-orange-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getMasteryIcon = (level: MasteryLevel) => {
    switch (level) {
      case 'Mastery': return <Trophy className="h-4 w-4" />
      case 'Proficient': return <CheckCircle2 className="h-4 w-4" />
      case 'Approaching': return <TrendingUp className="h-4 w-4" />
      case 'Developing': return <BookOpen className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getActionButtons = (subtopic: IGCSESubtopic) => {
    const subtopicProgress = progress[subtopic.id]
    const availability = questionAvailability[subtopic.id]

    // No questions available
    if (!availability || availability.total === 0) {
      return (
        <Badge variant="secondary" className="text-gray-500">
          No Questions Available
        </Badge>
      )
    }

    // No progress data - show assessment button
    if (!subtopicProgress || subtopicProgress.mastery_level === 'Unassessed') {
      return (
        <div className="space-y-2">
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
            <Target className="h-4 w-4 mr-2" />
            Take Assessment ({availability.baselineReady}Q)
          </Button>
          <p className="text-xs text-gray-600">Establish your baseline in this topic</p>
        </div>
      )
    }

    const performance = analyzePerformance(subtopicProgress)

    // Based on mastery level
    switch (subtopicProgress.mastery_level) {
      case 'Developing':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                <BookOpen className="h-4 w-4 mr-1" />
                Focus Practice
              </Button>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-orange-700">
              Focus on {performance.weaknesses.join(', ') || 'fundamental concepts'}
            </p>
          </div>
        )

      case 'Approaching':
        return (
          <div className="space-y-2">
            <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Practice Hard Questions
            </Button>
            <p className="text-xs text-yellow-700">
              You&apos;re close! Master the challenging concepts
            </p>
          </div>
        )

      case 'Proficient':
        return (
          <div className="space-y-2">
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
              <Trophy className="h-4 w-4 mr-2" />
              Attempt Mastery Quiz (15Q)
            </Button>
            <p className="text-xs text-green-700">
              Prove your mastery with the validation quiz
            </p>
          </div>
        )

      case 'Mastery':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="flex-1 bg-green-100 text-green-800 border-green-300 justify-center">
                <Award className="h-3 w-3 mr-1" />
                Mastered
              </Badge>
              <Button size="sm" variant="ghost">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-green-700">
              Excellent! Keep sharp with periodic reviews
            </p>
          </div>
        )

      default:
        return (
          <Button size="sm" className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
        )
    }
  }

  const getOverallProgress = () => {
    const allSubtopics = Object.values(subtopics).flat()
    const masteredCount = allSubtopics.filter(s => 
      progress[s.id]?.mastery_level === 'Mastery' || progress[s.id]?.mastery_level === 'Proficient'
    ).length
    
    return {
      total: allSubtopics.length,
      mastered: masteredCount,
      percentage: allSubtopics.length > 0 ? Math.round((masteredCount / allSubtopics.length) * 100) : 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IGCSE topics...</p>
        </div>
      </div>
    )
  }

  const overallProgress = getOverallProgress()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">IGCSE Mathematics Quiz Practice</h1>
        <p className="text-gray-600">
          Select a topic or specific subtopic to practice. All questions are aligned with Cambridge IGCSE 0580 syllabus.
        </p>
        
        {/* Path Selection */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">9 Core Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">40+ Core Subtopics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium">26+ Extended Subtopics</span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">{overallProgress.mastered}/{overallProgress.total} mastered</span>
          </div>
          <Progress value={overallProgress.percentage} className="h-2" />
        </div>

        {/* Core/Extended Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedPath('Core')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPath === 'Core'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Core
            </button>
            <button
              onClick={() => setSelectedPath('Extended')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPath === 'Extended'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Extended
            </button>
          </div>
        </div>
      </div>

      {/* Topics */}
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
                      const masteryLevel = subtopicProgress?.mastery_level || 'Unassessed'
                      const masteryPercentage = subtopicProgress?.mastery_percentage || 0
                      const performance = subtopicProgress ? analyzePerformance(subtopicProgress) : null

                      return (
                        <Card key={subtopic.id} className="border-l-2 border-l-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                  {getMasteryIcon(masteryLevel)}
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 truncate">
                                      {subtopic.subtopic_code} {subtopic.title}
                                    </h5>
                                    <Badge className={`text-xs ${getMasteryColor(masteryLevel)}`}>
                                      {masteryLevel} {masteryPercentage > 0 && `(${masteryPercentage}%)`}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-3">{subtopic.description}</p>
                                
                                {/* Progress Details */}
                                {subtopicProgress && subtopicProgress.questions_attempted > 0 && (
                                  <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600">Progress</span>
                                      <span className="font-medium">{masteryPercentage}%</span>
                                    </div>
                                    <Progress value={masteryPercentage} className="h-1.5" />
                                    
                                    {performance && (
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="text-center">
                                          <div className="font-medium text-green-600">{performance.easyAccuracy}%</div>
                                          <div className="text-gray-500">Easy</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="font-medium text-yellow-600">{performance.mediumAccuracy}%</div>
                                          <div className="text-gray-500">Medium</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="font-medium text-red-600">{performance.hardAccuracy}%</div>
                                          <div className="text-gray-500">Hard</div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Strengths and Weaknesses */}
                                    {performance && (performance.strengths.length > 0 || performance.weaknesses.length > 0) && (
                                      <div className="space-y-1">
                                        {performance.strengths.length > 0 && (
                                          <div className="flex items-start gap-2 text-xs">
                                            <span className="text-green-600 font-medium">💡 Strengths:</span>
                                            <span className="text-green-700">{performance.strengths.join(', ')}</span>
                                          </div>
                                        )}
                                        {performance.weaknesses.length > 0 && (
                                          <div className="flex items-start gap-2 text-xs">
                                            <span className="text-orange-600 font-medium">⚠️ Focus:</span>
                                            <span className="text-orange-700">{performance.weaknesses.join(', ')}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {subtopicProgress.last_practiced && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>Last practiced: {new Date(subtopicProgress.last_practiced).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex-shrink-0 w-48">
                                {getActionButtons(subtopic)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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
