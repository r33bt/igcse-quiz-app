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
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Star,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { 
  calculateComprehensiveMastery,
  calculateMasteryLevel, // Backward compatibility
  type ComprehensiveMasteryData 
} from '@/lib/enhanced-mastery-calculator'

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

// Core/Extended performance section with enhanced foundation indicators
const PerformanceColumn = ({ 
  title, 
  data, 
  color,
  masteryStatus 
}: { 
  title: string
  data: { easy: number[], medium: number[], hard: number[] }
  color: string
  masteryStatus?: { easy: boolean, medium: boolean, hard: boolean }
}) => (
  <div className="space-y-2">
    <h4 className={`text-sm font-semibold ${color} uppercase tracking-wide`}>{title}</h4>
    <div className="space-y-1">
      {Object.entries(data).map(([difficulty, values]) => {
        const [correct, attempted] = values as [number, number]
        const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
        const isMastered = masteryStatus && masteryStatus[difficulty as keyof typeof masteryStatus]
        
        return (
          <div key={difficulty} className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 capitalize">{difficulty}:</span>
              {isMastered && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{correct}/{attempted}</span>
              {attempted > 0 && (
                <span className={`text-xs ${isMastered ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  ({percentage}%)
                </span>
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
  
  // Enhanced mastery calculation system
  const masteryData = progress 
    ? calculateComprehensiveMastery(progress)
    : null
  
  const masteryInfo = masteryData?.current.level || {
    level: 0, 
    label: 'Unassessed', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'No baseline established yet. Take an assessment to see your current level.'
  }

  // Calculate Core/Extended breakdown
  const getPerformanceData = () => {
    if (!progress || progress.questions_attempted === 0) {
      return {
        core: { easy: [0, 0], medium: [0, 0], hard: [0, 0] },
        extended: { easy: [0, 0], medium: [0, 0], hard: [0, 0] }
      }
    }

    const coreTotal = progress.core_questions_attempted || 0
    const coreCorrect = progress.core_questions_correct || 0
    
    let coreRatio = 0.6 // Default 60% core
    if (progress.questions_attempted > 0 && coreTotal > 0) {
      coreRatio = coreTotal / progress.questions_attempted
    }

    const coreEasy = Math.round(progress.easy_questions_attempted * coreRatio)
    const coreMedium = Math.round(progress.medium_questions_attempted * coreRatio) 
    const coreHard = Math.round(progress.hard_questions_attempted * coreRatio)
    
    const extendedEasy = progress.easy_questions_attempted - coreEasy
    const extendedMedium = progress.medium_questions_attempted - coreMedium
    const extendedHard = progress.hard_questions_attempted - coreHard

    const coreAccuracy = coreTotal > 0 ? coreCorrect / coreTotal : progress.questions_correct / progress.questions_attempted
    const extendedAccuracy = progress.questions_correct / progress.questions_attempted

    const coreEasyCorrect = Math.round(coreEasy * coreAccuracy)
    const coreMediumCorrect = Math.round(coreMedium * coreAccuracy)
    const coreHardCorrect = Math.round(coreHard * coreAccuracy)

    const extendedEasyCorrect = Math.round(extendedEasy * extendedAccuracy)
    const extendedMediumCorrect = Math.round(extendedMedium * extendedAccuracy)
    const extendedHardCorrect = Math.round(extendedHard * extendedAccuracy)

    return {
      core: {
        easy: [Math.max(0, coreEasyCorrect), Math.max(0, coreEasy)],
        medium: [Math.max(0, coreMediumCorrect), Math.max(0, coreMedium)],
        hard: [Math.max(0, coreHardCorrect), Math.max(0, coreHard)]
      },
      extended: {
        easy: [Math.max(0, extendedEasyCorrect), Math.max(0, extendedEasy)],
        medium: [Math.max(0, extendedMediumCorrect), Math.max(0, extendedMedium)],
        hard: [Math.max(0, extendedHardCorrect), Math.max(0, extendedHard)]
      }
    }
  }

  const performanceData = getPerformanceData()

  // Enhanced analysis with data volume emphasis
  const getEnhancedAnalysis = () => {
    if (!masteryData || !progress || progress.questions_attempted === 0) {
      return ""
    }

    const { foundation, current, examReadiness } = masteryData
    let analysis = ""
    
    // Data volume context (your key point about accuracy)
    const dataReliability = progress.questions_attempted >= 24 ? 'highly reliable' : 
                           progress.questions_attempted >= 12 ? 'moderately reliable' : 'limited data'
    
    if (foundation.readyForAdvanced) {
      analysis = `Strong foundations established (${dataReliability} with ${progress.questions_attempted} questions). Easy: ${foundation.easyMastery}%, Medium: ${foundation.mediumMastery}%. Hard questions now contribute significantly to A* potential (${examReadiness.aStarPotential}%).`
    } else if (foundation.easyMastered) {
      analysis = `Good easy question mastery (${foundation.easyMastery}% from ${progress.easy_questions_attempted} questions). Focus on medium questions (${foundation.mediumMastery}% from ${progress.medium_questions_attempted} questions) to unlock advanced weighting system.`
    } else {
      analysis = `Building foundations (${dataReliability}). Easy question mastery (${foundation.easyMastery}% from ${progress.easy_questions_attempted} questions) is key to reliable assessment. Hard performance may not reflect true ability yet.`
    }

    // Emphasize need for more data when insufficient
    if (progress.questions_attempted < 12) {
      analysis += ` Take ${12 - progress.questions_attempted} more questions for more accurate analysis.`
    }

    return analysis
  }

  const analysis = getEnhancedAnalysis()

  // Enhanced recommendations with data volume emphasis
  const recommendations = masteryData?.recommendations || ["Start with the assessment to establish your baseline performance."]

  // Secondary actions for multiple options on right side
  const getSecondaryActions = () => {
    const actions = []
    
    // Always offer assessment if not recently taken or insufficient data
    if (!progress?.baseline_assessment_completed || (progress?.questions_attempted || 0) < 12) {
      actions.push({ 
        label: "Take Assessment", 
        url: `/quiz/assessment/${subtopic.id}`, 
        icon: Target,
        description: "Establish reliable baseline"
      })
    }
    
    // Offer targeted practice based on weakness
    if (masteryData?.examReadiness.weakestArea && masteryData.examReadiness.weakestArea !== 'balanced') {
      const weakest = masteryData.examReadiness.weakestArea
      actions.push({ 
        label: `Practice ${weakest.charAt(0).toUpperCase() + weakest.slice(1)}`, 
        url: `/quiz/practice/${subtopic.id}?focus=${weakest}`,
        icon: BookOpen,
        description: `Target weakness area`
      })
    }
    
    // Offer mixed practice for data collection
    if ((progress?.questions_attempted || 0) < 24) {
      actions.push({ 
        label: "Mixed Practice", 
        url: `/quiz/practice/${subtopic.id}`, 
        icon: BarChart3,
        description: "Build data for better analysis"
      })
    }
    
    // Offer review for high performers
    if (masteryInfo.level >= 4) {
      actions.push({ 
        label: "Quick Review", 
        url: `/quiz/review/${subtopic.id}`, 
        icon: RefreshCw,
        description: "Maintain mastery level"
      })
    }
    
    return actions.slice(0, 3) // Limit to 3 secondary actions
  }

  const secondaryActions = getSecondaryActions()

  // Primary action button (existing logic)
  const getPrimaryActionButton = () => {
    if (!availability || availability.total === 0) {
      return (
        <Badge variant="secondary" className="text-gray-500 w-full justify-center py-2">
          No Questions Available
        </Badge>
      )
    }

    // Emphasize data collection when insufficient
    if (masteryData && masteryData.current.confidence.needMoreQuestions) {
      return (
        <Link href={`/quiz/practice/${subtopic.id}`}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
            <Target className="h-4 w-4 mr-2" />
            Build Data ({masteryData.current.confidence.questionsUsed}/12)
          </Button>
        </Link>
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
      case 1:
        return (
          <Link href={`/quiz/practice/${subtopic.id}?focus=easy`}>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg">
              <BookOpen className="h-4 w-4 mr-2" />
              Practice Basics
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
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
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
              <span className="text-sm font-medium text-green-800">Level 5 Mastery Achieved</span>
            </div>
            <Link href={`/quiz/review/${subtopic.id}`}>
              <Button variant="outline" className="w-full py-2 rounded-lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Periodic Review
              </Button>
            </Link>
          </div>
        )
      default:
        return (
          <Link href={`/quiz/assessment/${subtopic.id}`}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">
              <Target className="h-4 w-4 mr-2" />
              Start Assessment
            </Button>
          </Link>
        )
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border rounded-xl bg-white">
      <CardContent className="p-6">
        {/* TWO-COLUMN LAYOUT: 2/3 + 1/3 */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (2/3): Title + Performance + Foundation + Analysis */}
          <div className="col-span-2 space-y-4">
            {/* Title and Subtitle with Icon */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {subtopic.subtopic_code} {subtopic.title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {subtopic.description}
                </p>
              </div>
            </div>

            {/* Core/Extended Performance Data */}
            {progress && progress.questions_attempted > 0 && (
              <div className="grid grid-cols-2 gap-6 py-3 border-t border-gray-100">
                <PerformanceColumn 
                  title="Core"
                  data={performanceData.core}
                  color="text-blue-700"
                  masteryStatus={masteryData ? {
                    easy: masteryData.foundation.easyMastered,
                    medium: masteryData.foundation.mediumMastered,
                    hard: masteryData.foundation.readyForAdvanced && masteryData.foundation.hardMastery >= 70
                  } : undefined}
                />
                <PerformanceColumn 
                  title="Extended" 
                  data={performanceData.extended}
                  color="text-purple-700"
                  masteryStatus={masteryData ? {
                    easy: masteryData.foundation.easyMastered,
                    medium: masteryData.foundation.mediumMastered,
                    hard: masteryData.foundation.readyForAdvanced && masteryData.foundation.hardMastery >= 70
                  } : undefined}
                />
              </div>
            )}

            {/* MOVED: Foundation Status with Question Counts */}
            {masteryData && progress && progress.questions_attempted > 0 && (
              <div className="py-3 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Foundation Analysis (All Questions)
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Easy:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{masteryData.foundation.easyMastery}%</span>
                      <span className="text-xs text-gray-500">({progress.easy_questions_attempted}Q)</span>
                      {masteryData.foundation.easyMastered && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medium:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{masteryData.foundation.mediumMastery}%</span>
                      <span className="text-xs text-gray-500">({progress.medium_questions_attempted}Q)</span>
                      {masteryData.foundation.mediumMastered && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hard:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{masteryData.foundation.hardMastery}%</span>
                      <span className="text-xs text-gray-500">({progress.hard_questions_attempted}Q)</span>
                      {masteryData.foundation.readyForAdvanced && masteryData.foundation.hardMastery >= 70 && <Star className="h-3 w-3 text-yellow-600" />}
                    </div>
                  </div>
                </div>
                
                {/* Advanced Ready Status */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">Advanced Weighting:</span>
                  <Badge variant={masteryData.foundation.readyForAdvanced ? "default" : "secondary"} className="text-xs">
                    {masteryData.foundation.readyForAdvanced ? "Unlocked" : "Locked"}
                  </Badge>
                  {!masteryData.foundation.readyForAdvanced && (
                    <span className="text-xs text-gray-500">
                      (Need 80% Easy + 70% Medium)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Analysis */}
            {analysis && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">Smart Analysis:</div>
                    <div className="text-sm text-blue-800">{analysis}</div>
                  </div>
                </div>
              </div>
            )}

            {/* A* Potential Indicator */}
            {masteryData && masteryData.examReadiness.aStarPotential > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm">
                    <span className="font-medium text-yellow-900">A* Potential: </span>
                    <span className="text-yellow-800">{masteryData.examReadiness.aStarPotential}%</span>
                    <span className="text-xs text-yellow-700 ml-2">
                      (Based on {progress?.questions_attempted || 0} questions)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (1/3): Level + Primary Action + Secondary Actions */}
          <div className="col-span-1 space-y-4">
            {/* Enhanced Level Display */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">Level {masteryInfo.level}</div>
              <Badge className={`text-sm font-medium px-3 py-1 mb-3 ${masteryInfo.color}`}>
                {masteryInfo.label}
              </Badge>
              
              {/* Confidence and data context */}
              {masteryData && masteryData.current.confidence.level !== 'high' && (
                <div className="flex items-center justify-center gap-1 mb-2">
                  <AlertCircle className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {masteryData.current.confidence.questionsUsed}/12+ questions
                  </span>
                </div>
              )}
              
              <p className="text-xs text-gray-600 leading-relaxed">
                {masteryInfo.description}
              </p>

              {/* Overall Level Context */}
              {masteryData && masteryData.overall.level.level !== masteryData.current.level.level && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  Overall: Level {masteryData.overall.level.level} ({masteryData.overall.accuracy}%)
                </div>
              )}
            </div>

            {/* Primary Call to Action */}
            <div className="pt-2">
              {getPrimaryActionButton()}
            </div>

            {/* Secondary Actions */}
            {secondaryActions.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  More Options
                </h4>
                <div className="space-y-2">
                  {secondaryActions.map((action, index) => (
                    <Link key={index} href={action.url}>
                      <div className="flex items-center justify-between p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <action.icon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{action.label}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500 ml-6 -mt-1">
                        {action.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Recommendations */}
            {recommendations.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Smart Recommendations
                </h4>
                <div className="space-y-1">
                  {recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="text-xs text-gray-600 leading-relaxed">
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {progress?.last_practiced && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Last: {new Date(progress.last_practiced).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
