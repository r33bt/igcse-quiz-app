"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Target, 
  BookOpen, 
  Trophy, 
  CheckCircle2, 
  RefreshCw, 
  Clock,
  Award,
  TrendingUp
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

// Convert mastery level to simple level system (0-5)
const getMasteryLevel = (masteryLevel: MasteryLevel): { level: number, label: string, color: string } => {
  const levelMap = {
    'Unassessed': { level: 0, label: 'Unassessed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    'Developing': { level: 2, label: 'Developing', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    'Approaching': { level: 3, label: 'Approaching', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    'Proficient': { level: 4, label: 'Proficient', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'Mastery': { level: 5, label: 'Mastery', color: 'bg-green-100 text-green-700 border-green-200' }
  }
  return levelMap[masteryLevel] || levelMap['Unassessed']
}

// Core/Extended performance section
const PerformanceColumn = ({ 
  title, 
  data, 
  color 
}: { 
  title: string
  data: { easy: number[], medium: number[], hard: number[] }
  color: string 
}) => (
  <div className="space-y-3">
    <h4 className={`text-sm font-semibold ${color} uppercase tracking-wide`}>{title}</h4>
    <div className="space-y-2">
      {Object.entries(data).map(([difficulty, [correct, attempted]]) => {
        const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
        return (
          <div key={difficulty} className="flex justify-between items-center">
            <span className="text-sm text-gray-600 capitalize">{difficulty}:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{correct}/{attempted}</span>
              {attempted > 0 && (
                <span className="text-xs text-gray-500">({percentage}%)</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

export default function SubtopicProgressCard({ 
  subtopic, 
  progress, 
  availability 
}: SubtopicProgressCardProps) {
  
  const masteryInfo = getMasteryLevel(progress?.mastery_level || 'Unassessed') || { level: 0, label: 'Unassessed', color: 'bg-gray-100 text-gray-700 border-gray-200' }
  
  // Calculate Core/Extended breakdown
  const getPerformanceData = () => {
    if (!progress) {
      return {
        core: { easy: [0, 0], medium: [0, 0], hard: [0, 0] },
        extended: { easy: [0, 0], medium: [0, 0], hard: [0, 0] }
      }
    }

    // Estimate Core vs Extended split (60% core, 40% extended)
    const coreRatio = progress.core_questions_attempted > 0 
      ? progress.core_questions_attempted / progress.questions_attempted 
      : 0.6

    const coreEasy = Math.round(progress.easy_questions_attempted * coreRatio)
    const coreMedium = Math.round(progress.medium_questions_attempted * coreRatio) 
    const coreHard = Math.round(progress.hard_questions_attempted * coreRatio)
    
    const extendedEasy = progress.easy_questions_attempted - coreEasy
    const extendedMedium = progress.medium_questions_attempted - coreMedium
    const extendedHard = progress.hard_questions_attempted - coreHard

    const coreEasyCorrect = Math.round(progress.easy_questions_correct * coreRatio)
    const coreMediumCorrect = Math.round(progress.medium_questions_correct * coreRatio)
    const coreHardCorrect = Math.round(progress.hard_questions_correct * coreRatio)

    const extendedEasyCorrect = progress.easy_questions_correct - coreEasyCorrect
    const extendedMediumCorrect = progress.medium_questions_correct - coreMediumCorrect
    const extendedHardCorrect = progress.hard_questions_correct - coreHardCorrect

    return {
      core: {
        easy: [Math.max(0, coreEasyCorrect), Math.max(0, coreEasy)] as [number, number],
        medium: [Math.max(0, coreMediumCorrect), Math.max(0, coreMedium)] as [number, number],
        hard: [Math.max(0, coreHardCorrect), Math.max(0, coreHard)] as [number, number]
      },
      extended: {
        easy: [Math.max(0, extendedEasyCorrect), Math.max(0, extendedEasy)] as [number, number],
        medium: [Math.max(0, extendedMediumCorrect), Math.max(0, extendedMedium)] as [number, number],
        hard: [Math.max(0, extendedHardCorrect), Math.max(0, extendedHard)] as [number, number]
      }
    }
  }

  const performanceData = getPerformanceData()

  // Smart action buttons
  const getActionButton = () => {
    if (!availability || availability.total === 0) {
      return (
        <Badge variant="secondary" className="text-gray-500">
          No Questions Available
        </Badge>
      )
    }

    switch (masteryInfo.level) {
      case 0:
        return (
          <Link href={`/quiz/assessment/${subtopic.id}`}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
              <Target className="h-4 w-4 mr-2" />
              Take Assessment
            </Button>
          </Link>
        )
      case 2:
        return (
          <Link href={`/quiz/practice/${subtopic.id}`}>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg">
              <BookOpen className="h-4 w-4 mr-2" />
              Focus Practice
            </Button>
          </Link>
        )
      case 3:
        return (
          <Link href={`/quiz/practice/${subtopic.id}?focus=hard`}>
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2" />
              Practice Hard Questions
            </Button>
          </Link>
        )
      case 4:
        return (
          <Link href={`/quiz/mastery/${subtopic.id}`}>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg">
              <Award className="h-4 w-4 mr-2" />
              Attempt Mastery
            </Button>
          </Link>
        )
      case 5:
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800 border-green-300 font-medium">
                ✅ Level 5 Mastery
              </Badge>
            </div>
            <Link href={`/quiz/review/${subtopic.id}`}>
              <Button variant="outline" className="w-full py-2 rounded-lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Review
              </Button>
            </Link>
          </div>
        )
      default:
        return (
          <Link href={`/quiz/assessment/${subtopic.id}`}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
              <Target className="h-4 w-4 mr-2" />
              Start Quiz
            </Button>
          </Link>
        )
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border rounded-xl bg-white">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* TOP SECTION: Title + Subtitle + Icon (LEFT) and Level (RIGHT) */}
          <div className="flex items-start justify-between">
            {/* LEFT: Title + Subtitle + Icon grouped together */}
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {subtopic.subtopic_code} {subtopic.title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed font-medium">
                  {subtopic.description}
                </p>
              </div>
            </div>
            
            {/* RIGHT: Simple Level System */}
            <div className="flex flex-col items-end gap-2 ml-6">
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">Level {masteryInfo.level}</div>
                <Badge className={`text-sm font-medium px-3 py-1 ${masteryInfo.color}`}>
                  {masteryInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: Clean Core/Extended Performance Data */}
          {progress && progress.questions_attempted > 0 && (
            <div className="grid grid-cols-2 gap-8 py-4 border-t border-gray-100">
              <PerformanceColumn 
                title="Core"
                data={performanceData.core}
                color="text-blue-700"
              />
              <PerformanceColumn 
                title="Extended" 
                data={performanceData.extended}
                color="text-purple-700"
              />
            </div>
          )}

          {/* BOTTOM SECTION: Action Button + Small Metadata */}
          <div className="flex items-end justify-between pt-4 border-t border-gray-100">
            {/* LEFT: Action Button */}
            <div className="flex-1 pr-6">
              {getActionButton()}
            </div>
            
            {/* RIGHT: Small Metadata in bottom corner */}
            {progress?.last_practiced && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Last practiced: {new Date(progress.last_practiced).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
