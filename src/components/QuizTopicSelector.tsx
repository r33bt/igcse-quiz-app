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
    // Fix: Use auth state change listener instead of getUser()
    // Robust auth check - try multiple methods
    let user = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user = session?.user
      if (!user) {
        const { data: { user: getUser } } = await supabase.auth.getUser()
        user = getUser
      }
      // Fallback to your known user ID for testing
      if (!user) {
        console.log('?? DEBUG: Using fallback user ID for testing')
        user = { id: "a1b2c3d4-e5f6-7890-1234-567890abcdef" }
      }
    } catch (authError) {
      console.log('?? DEBUG: Auth error, using fallback:', authError)
      user = { id: "a1b2c3d4-e5f6-7890-1234-567890abcdef" }
    }
    console.log('?? DEBUG: Current user:', user?.id) // TEMP DEBUG
      if (!user) return

      const { data: progressData, error } = await supabase
        .from('user_subtopic_progress')
        .select('*')
      .eq('user_id', user?.id || 'a8ff59f4-cc3b-4afe-a1f7-826c73cc27b7')
        .in('subtopic_id', subtopicIds)

    console.log('?? DEBUG: Full query - user_id:', user.id, 'subtopic_ids:', subtopicIds)

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
