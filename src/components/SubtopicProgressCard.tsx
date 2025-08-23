// Enhanced SubtopicProgressCard.tsx - Full file replacement
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

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120 }: { percentage: number, size?: number }) => {
  const radius = (size - 8) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10b981"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
      </div>
    </div>
  )
}

// Difficulty Bar Component  
const DifficultyBar = ({ 
  label, 
  percentage, 
  color,
  attempted,
  correct 
}: { 
  label: string
  percentage: number
  color: string
  attempted: number
  correct: number
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500', 
      red: 'bg-red-500'
    }
    return colors[color as keyof typeof colors] || colors.green
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-sm font-medium text-gray-700 w-12">{label}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getColorClasses(color)}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <div className="text-right ml-4">
        <div className="text-sm font-semibold text-gray-900">{percentage}%</div>
        <div className="text-xs text-gray-500">{correct}/{attempted}</div>
      </div>
    </div>
  )
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

  // Get estimated time for next action
  const getEstimatedTime = (level: MasteryLevel): string => {
    const times = {
      'Unassessed': '8 min',
      'Developing': '15 min', 
      'Approaching': '12 min',
      'Proficient': '20 min',
      'Mastery': '5 min'
    }
    return times[level]
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

    const estimatedTime = getEstimatedTime(masteryLevel)

    switch (masteryLevel) {
      case 'Unassessed':
        return (
          <div className="space-y-3">
            <Link href={`/quiz/assessment/${subtopic.id}`}>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 text-base rounded-xl shadow-lg">
                Take Assessment
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime}</span>
            </div>
          </div>
        )

      case 'Developing':
        return (
          <div className="space-y-3">
            <Link href={`/quiz/practice/${subtopic.id}`}>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 text-base rounded-xl shadow-lg">
                Focus Practice
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime}</span>
            </div>
            <div className="flex gap-2">
              <Link href={`/quiz/assessment/${subtopic.id}`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retake
                </Button>
              </Link>
              <Link href={`/quiz/review/${subtopic.id}`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Review
                </Button>
              </Link>
            </div>
          </div>
        )

      case 'Approaching':
        return (
          <div className="space-y-3">
            <Link href={`/quiz/practice/${subtopic.id}?focus=hard`}>
              <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-4 text-base rounded-xl shadow-lg">
                Practice Hard Questions
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime}</span>
            </div>
          </div>
        )

      case 'Proficient':
        return (
          <div className="space-y-3">
            <Link href={`/quiz/mastery/${subtopic.id}`}>
              <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 text-base rounded-xl shadow-lg">
                <Trophy className="h-4 w-4 mr-2" />
                Attempt Mastery Quiz
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{estimatedTime}</span>
            </div>
          </div>
        )

      case 'Mastery':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800 border-green-300 font-medium text-sm">
                ✅ Mastered
              </Badge>
            </div>
            <Link href={`/quiz/review/${subtopic.id}`}>
              <Button variant="outline" className="w-full py-3 rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" />
                Periodic Review
              </Button>
            </Link>
          </div>
        )

      default:
        return (
          <Link href={`/quiz/assessment/${subtopic.id}`}>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 text-base rounded-xl shadow-lg">
              <Target className="h-4 w-4 mr-2" />
              Start Quiz
            </Button>
          </Link>
        )
    }
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header with Topic Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                {subtopic.paper_type}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs font-medium px-2 py-1 ${
                  masteryLevel === 'Mastery' ? 'text-green-700 border-green-300' :
                  masteryLevel === 'Proficient' ? 'text-blue-700 border-blue-300' :
                  masteryLevel === 'Approaching' ? 'text-yellow-700 border-yellow-300' :
                  masteryLevel === 'Developing' ? 'text-orange-700 border-orange-300' :
                  'text-gray-600 border-gray-300'
                }`}
              >
                {masteryLevel}
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {subtopic.subtopic_code} {subtopic.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {subtopic.description}
            </p>
          </div>

          {/* Progress Section */}
          {progress && progress.questions_attempted > 0 ? (
            <div className="space-y-6">
              {/* Circular Progress */}
              <div className="flex justify-center">
                <CircularProgress percentage={masteryPercentage} size={140} />
              </div>

              {/* Difficulty Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 text-center mb-4">
                  Performance Breakdown
                </h4>
                <div className="space-y-2">
                  <DifficultyBar
                    label="Easy"
                    percentage={metrics.easyAccuracy}
                    color="green"
                    attempted={progress.easy_questions_attempted}
                    correct={progress.easy_questions_correct}
                  />
                  <DifficultyBar
                    label="Medium"
                    percentage={metrics.mediumAccuracy}
                    color="yellow"
                    attempted={progress.medium_questions_attempted}
                    correct={progress.medium_questions_correct}
                  />
                  <DifficultyBar
                    label="Hard"
                    percentage={metrics.hardAccuracy}
                    color="red"
                    attempted={progress.hard_questions_attempted}
                    correct={progress.hard_questions_correct}
                  />
                </div>
              </div>

              {/* Insights */}
              {(metrics.strengths.length > 0 || metrics.weaknesses.length > 0) && (
                <div className="space-y-2">
                  {metrics.strengths.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-green-900">Strengths:</div>
                        <div className="text-sm text-green-700">{metrics.strengths.join(', ')}</div>
                      </div>
                    </div>
                  )}
                  
                  {metrics.weaknesses.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-orange-900">Focus:</div>
                        <div className="text-sm text-orange-700">{metrics.weaknesses.join(', ')}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Practiced */}
              {progress.last_practiced && (
                <div className="text-center text-xs text-gray-500">
                  Last practiced: {new Date(progress.last_practiced).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-10 w-10 text-gray-400" />
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Ready to start?</div>
              <div className="text-sm text-gray-600">
                Take your first assessment to see how you perform
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4">
            {getActionButtons()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
