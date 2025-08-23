// ENHANCED VERSION - Replace your current SubtopicProgressCard.tsx with this:
"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Target, 
  BookOpen, 
  Trophy, 
  CheckCircle2, 
  RefreshCw, 
  BarChart3, 
  Clock,
  User,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
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

  const getMasteryBorderColor = (level: MasteryLevel): string => {
    const colors = {
      'Mastery': '#22c55e',
      'Proficient': '#3b82f6',
      'Approaching': '#eab308',
      'Developing': '#f97316',
      'Unassessed': '#94a3b8'
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
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                <Target className="h-4 w-4 mr-2" />
                Take Assessment ({availability.baselineReady}Q)
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center">
              ~ 8 minutes • Establish your baseline in this topic
            </p>
          </div>
        )

      case 'Developing':
        return (
          <div className="space-y-3">
            <Link href={`/quiz/practice/${subtopic.id}`}>
              <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 h-12">
                <BookOpen className="h-4 w-4 mr-2" />
                Focus Practice (8Q)
              </Button>
            </Link>
            <p className="text-xs text-gray-600 text-center">
              Target your weak areas for improvement
            </p>
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
              <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700 h-12">
                <BarChart3 className="h-4 w-4 mr-2" />
                Practice Hard Questions (5Q)
              </Button>
            </Link>
            <p className="text-xs text-gray-600 text-center">
              Challenge yourself with complex problems
            </p>
          </div>
        )

      case 'Proficient':
        return (
          <div className="space-y-2">
            <Link href={`/quiz/mastery/${subtopic.id}`}>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-12">
                <Trophy className="h-4 w-4 mr-2" />
                Attempt Mastery Quiz (15Q)
              </Button>
            </Link>
            <p className="text-xs text-gray-600 text-center">
              ~ 12 minutes • Prove your mastery with validation quiz
            </p>
          </div>
        )

      case 'Mastery':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800 border-green-300 font-medium">
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
    <Card 
      className="hover:shadow-lg transition-all duration-200 border-l-4" 
      style={{ borderLeftColor: getMasteryBorderColor(masteryLevel) }}
    >
      <CardContent className="p-0">
        {/* 1. FIXED CONTENT SECTION - Subtopic Info */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                Topic {subtopic.subtopic_code}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {subtopic.paper_type}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {subtopic.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {subtopic.description}
          </p>
        </div>

        {/* 2. USER PERFORMANCE SECTION - Your Progress */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 uppercase tracking-wide">
              Your Performance
            </span>
          </div>

          {progress && progress.questions_attempted > 0 ? (
            <div className="space-y-4">
              {/* Overall Progress - Prominent Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getMasteryColor(masteryLevel)}`} />
                    <span className="font-semibold text-slate-900">
                      {masteryLevel}
                    </span>
                    <Badge className={`${getMasteryTextColor(masteryLevel)} bg-white border font-medium`}>
                      {masteryPercentage}%
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {progress.questions_correct}/{progress.questions_attempted}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">correct</div>
                  </div>
                </div>
                <Progress value={masteryPercentage} className="h-3" />
              </div>

              {/* Performance Breakdown - Enhanced */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Difficulty Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-700">{metrics.easyAccuracy}%</div>
                    <div className="text-xs text-slate-600 mb-1">Easy Questions</div>
                    <div className="text-xs text-slate-500">
                      {progress.easy_questions_correct}/{progress.easy_questions_attempted}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="text-lg font-bold text-amber-700">{metrics.mediumAccuracy}%</div>
                    <div className="text-xs text-slate-600 mb-1">Medium Questions</div>
                    <div className="text-xs text-slate-500">
                      {progress.medium_questions_correct}/{progress.medium_questions_attempted}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-lg font-bold text-red-700">{metrics.hardAccuracy}%</div>
                    <div className="text-xs text-slate-600 mb-1">Hard Questions</div>
                    <div className="text-xs text-slate-500">
                      {progress.hard_questions_correct}/{progress.hard_questions_attempted}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Insights */}
              <div className="space-y-2">
                {metrics.strengths.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-green-900">You&apos;re doing well:</div>
                      <div className="text-sm text-green-700">{metrics.strengths.join(', ')}</div>
                    </div>
                  </div>
                )}
                
                {metrics.weaknesses.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-orange-900">Focus areas:</div>
                      <div className="text-sm text-orange-700">{metrics.weaknesses.join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Info */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  Last practiced: {progress.last_practiced ? new Date(progress.last_practiced).toLocaleDateString() : 'Never'}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Target className="h-3 w-3" />
                  {progress.questions_attempted} attempts
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-8 w-8 text-slate-400" />
              </div>
              <div className="text-slate-900 font-medium mb-1">Ready to start?</div>
              <div className="text-sm text-slate-500">
                Take your first assessment to see how you perform
              </div>
            </div>
          )}
        </div>

        {/* 3. CALL TO ACTION SECTION - What You Should Do */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900 uppercase tracking-wide">
              Recommended Action
            </span>
          </div>
          
          {getActionButtons()}
        </div>
      </CardContent>
    </Card>
  )
}
