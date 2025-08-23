"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Target, BookOpen, Trophy, CheckCircle2, RefreshCw, BarChart3, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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

interface QuestionAvailability {
  total: number
  byDifficulty: { easy: number, medium: number, hard: number }
  byCategory: { core: number, extended: number }
  baselineReady: number
}

interface SubtopicProgressCardProps {
  subtopic: IGCSESubtopic
  progress?: SubtopicProgress
  availability: QuestionAvailability
}

export default function SubtopicProgressCard({ 
  subtopic, 
  progress, 
  availability 
}: SubtopicProgressCardProps) {
  
  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (!progress || progress.questions_attempted === 0) {
      return {
        easyAccuracy: 0,
        mediumAccuracy: 0,
        hardAccuracy: 0,
        overallAccuracy: 0,
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    }

    const easyAccuracy = progress.easy_questions_attempted > 0 
      ? Math.round((progress.easy_questions_correct / progress.easy_questions_attempted) * 100)
      : 0
    
    const mediumAccuracy = progress.medium_questions_attempted > 0
      ? Math.round((progress.medium_questions_correct / progress.medium_questions_attempted) * 100)
      : 0
    
    const hardAccuracy = progress.hard_questions_attempted > 0
      ? Math.round((progress.hard_questions_correct / progress.hard_questions_attempted) * 100)
      : 0

    const overallAccuracy = progress.questions_attempted > 0
      ? Math.round((progress.questions_correct / progress.questions_attempted) * 100)
      : 0

    // Identify strengths and weaknesses
    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendations: string[] = []

    if (easyAccuracy >= 80) {
      strengths.push("Strong fundamentals")
    } else if (easyAccuracy < 60 && progress.easy_questions_attempted > 3) {
      weaknesses.push("Basic concepts need review")
      recommendations.push("Focus on fundamental concepts")
    }

    if (mediumAccuracy >= 75) {
      strengths.push("Good application skills")
    } else if (mediumAccuracy < 60 && progress.medium_questions_attempted > 3) {
      weaknesses.push("Application skills need work")
      recommendations.push("Practice medium difficulty problems")
    }

    if (hardAccuracy >= 70) {
      strengths.push("Excellent problem-solving")
    } else if (hardAccuracy < 50 && progress.hard_questions_attempted > 2) {
      weaknesses.push("Complex problems challenging")
      recommendations.push("Build up to harder questions gradually")
    }

    return {
      easyAccuracy,
      mediumAccuracy, 
      hardAccuracy,
      overallAccuracy,
      strengths,
      weaknesses,
      recommendations
    }
  }

  const metrics = getPerformanceMetrics()
  const masteryLevel = progress?.mastery_level || 'Unassessed'
  const masteryPercentage = progress?.mastery_percentage || 0

  // Get mastery level styling
  const getMasteryColor = (level: MasteryLevel): string => {
    const colors = {
      'Mastery': 'bg-green-500',
      'Proficient': 'bg-blue-500',
      'Approaching': 'bg-yellow-500', 
      'Developing': 'bg-orange-500',
      'Unassessed': 'bg-gray-300'
    }
    return colors[level]
  }

  const getMasteryTextColor = (level: MasteryLevel): string => {
    const colors = {
      'Mastery': 'text-green-700',
      'Proficient': 'text-blue-700',
      'Approaching': 'text-yellow-700',
      'Developing': 'text-orange-700', 
      'Unassessed': 'text-gray-600'
    }
    return colors[level]
  }

  // Smart action buttons based on mastery level
  const getActionButtons = () => {
    if (!availability || availability.total === 0) {
      return (
        <Badge variant="secondary" className="text-gray-500">
          No Questions Available
        </Badge>
      )
    }

    switch (masteryLevel) {
      case 'Unassessed':
        return (
          <div className="space-y-2">
            <Link href={`/quiz/assessment/${subtopic.id}`}>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                <Target className="h-4 w-4 mr-2" />
                Take Assessment ({availability.baselineReady}Q)
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center">
              Establish your baseline in this topic
            </p>
          </div>
        )

      case 'Developing':
        return (
          <div className="space-y-2">
            <Link href={`/quiz/practice/${subtopic.id}`}>
              <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                <BookOpen className="h-4 w-4 mr-2" />
                Focus Practice (8Q)
              </Button>
            </Link>
            <div className="flex gap-2">
              <Link href={`/quiz/assessment/${subtopic.id}`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retake Assessment
                </Button>
              </Link>
              <Link href={`/quiz/review/${subtopic.id}`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Review Basics
                </Button>
              </Link>
            </div>
          </div>
        )

      case 'Approaching':
        return (
          <div className="space-y-2">
            <Link href={`/quiz/practice/${subtopic.id}?focus=hard`}>
              <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Practice Hard Questions (5Q)
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center">
              You're close! Master the challenging concepts
            </p>
          </div>
        )

      case 'Proficient':
        return (
          <div className="space-y-2">
            <Link href={`/quiz/mastery/${subtopic.id}`}>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                <Trophy className="h-4 w-4 mr-2" />
                Attempt Mastery Quiz (15Q)
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center">
              Prove your mastery with validation quiz
            </p>
          </div>
        )

      case 'Mastery':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <Badge className="bg-green-100 text-green-800 border-green-300">
                ✅ Mastered
              </Badge>
            </div>
            <Link href={`/quiz/review/${subtopic.id}`}>
              <Button size="sm" variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Periodic Review (5Q)
              </Button>
            </Link>
          </div>
        )

      default:
        return (
          <Link href={`/quiz/assessment/${subtopic.id}`}>
            <Button size="sm" className="w-full">
              <Target className="h-4 w-4 mr-2" />
              Start Quiz
            </Button>
          </Link>
        )
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${getMasteryColor(masteryLevel)}`}></div>
                <h3 className="font-semibold text-gray-900">
                  {subtopic.subtopic_code} {subtopic.title}
                </h3>
                <Badge variant="outline" className={`text-xs ${getMasteryTextColor(masteryLevel)}`}>
                  {masteryLevel}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{subtopic.description}</p>
              
              {/* Mastery Progress */}
              {progress && progress.questions_attempted > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{masteryPercentage}%</span>
                  </div>
                  <Progress value={masteryPercentage} className="h-2" />
                </div>
              )}
            </div>
          </div>

          {/* Performance Breakdown */}
          {progress && progress.questions_attempted > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Performance Breakdown</h4>
              
              {/* Difficulty Analysis */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-medium text-green-700">Easy</div>
                  <div className="text-green-600">
                    {metrics.easyAccuracy}% ({progress.easy_questions_correct}/{progress.easy_questions_attempted})
                  </div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="font-medium text-yellow-700">Medium</div>
                  <div className="text-yellow-600">
                    {metrics.mediumAccuracy}% ({progress.medium_questions_correct}/{progress.medium_questions_attempted})
                  </div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="font-medium text-red-700">Hard</div>
                  <div className="text-red-600">
                    {metrics.hardAccuracy}% ({progress.hard_questions_correct}/{progress.hard_questions_attempted})
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              {(metrics.strengths.length > 0 || metrics.weaknesses.length > 0) && (
                <div className="space-y-2">
                  {metrics.strengths.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-green-600 font-medium">💡 Strengths:</div>
                      <div className="text-xs text-green-600">{metrics.strengths.join(', ')}</div>
                    </div>
                  )}
                  {metrics.weaknesses.length > 0 && (
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-orange-600 font-medium">⚠️ Focus Areas:</div>
                      <div className="text-xs text-orange-600">{metrics.weaknesses.join(', ')}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>{progress.questions_attempted} attempted</span>
                </div>
                {progress.last_practiced && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Last: {new Date(progress.last_practiced).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-gray-100">
            {getActionButtons()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
