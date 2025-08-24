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
  ArrowRight,
  Lock,
  Unlock
} from 'lucide-react'
import Link from 'next/link'
import { 
  calculateComprehensiveMastery,
  calculateMasteryLevel,
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

// Core/Extended performance section
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
  <div className="space-y-3">
    <h4 className={`text-sm font-semibold ${color} uppercase tracking-wide`}>{title}</h4>
    <div className="space-y-2">
      {Object.entries(data).map(([difficulty, values]) => {
        const [correct, attempted] = values as [number, number]
        const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
        const isMastered = masteryStatus && masteryStatus[difficulty as keyof typeof masteryStatus]
        
        return (
          <div key={difficulty} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
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
    
    let coreRatio = 0.6
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

  // IMPROVED: Truly dynamic smart analysis based on actual data
  const getDynamicSmartAnalysis = () => {
    if (!masteryData || !progress || progress.questions_attempted === 0) {
      return ""
    }

    const { foundation, current } = masteryData
    const totalQuestions = progress.questions_attempted
    
    // Data reliability assessment
    const dataReliability = totalQuestions >= 24 ? 'highly reliable' : 
                           totalQuestions >= 12 ? 'moderately reliable' : 'limited'
    
    // Analyze the actual performance patterns
    let analysis = ""
    
    if (totalQuestions < 12) {
      analysis = `Building baseline (${totalQuestions} questions so far). Need ${12 - totalQuestions} more questions for reliable assessment. Current performance shows potential but more data needed for accurate level determination.`
    } else if (foundation.easyMastered && foundation.mediumMastered) {
      analysis = `Strong foundations confirmed (${dataReliability} data from ${totalQuestions} questions). Easy: ${foundation.easyMastery}% (${progress.easy_questions_attempted}Q), Medium: ${foundation.mediumMastery}% (${progress.medium_questions_attempted}Q). Hard questions now carry extra weight toward A* success.`
    } else if (foundation.easyMastered) {
      analysis = `Easy questions mastered (${foundation.easyMastery}% from ${progress.easy_questions_attempted} questions). Medium questions (${foundation.mediumMastery}% from ${progress.medium_questions_attempted} questions) need focus to unlock advanced progression path.`
    } else {
      // Key insight: Don't recommend hard if easy/medium insufficient
      const easyNeeded = progress.easy_questions_attempted < 6
      const mediumNeeded = progress.medium_questions_attempted < 4
      
      if (easyNeeded || mediumNeeded) {
        analysis = `Foundation building phase (${dataReliability} data). Focus on easy questions first - only ${progress.easy_questions_attempted} attempted so far. Hard question results less reliable until basics are solid.`
      } else {
        analysis = `Developing foundations. Easy accuracy ${foundation.easyMastery}% needs improvement to 80%+ before medium/hard questions contribute fully to level assessment.`
      }
    }

    return analysis
  }

  const analysis = getDynamicSmartAnalysis()

  // IMPROVED: Logic-based recommendations that match the data
  const getSmartRecommendations = () => {
    if (!masteryData || !progress) {
      return ["Start with assessment to establish baseline performance."]
    }

    const recommendations = []
    const totalQuestions = progress.questions_attempted

    // Priority 1: Insufficient data
    if (totalQuestions < 12) {
      recommendations.push(`Take ${12 - totalQuestions} more questions for reliable level assessment`)
      
      // Recommend easy/medium first if insufficient
      if (progress.easy_questions_attempted < 6) {
        recommendations.push("Focus on easy questions first to build foundation data")
      } else if (progress.medium_questions_attempted < 4) {
        recommendations.push("Practice medium questions to complete foundation assessment")
      }
      return recommendations
    }

    // Priority 2: Foundation-based recommendations
    if (!masteryData.foundation.easyMastered) {
      recommendations.push("Master easy questions first (80%+ needed) - foundation critical for A* success")
    } else if (!masteryData.foundation.mediumMastered) {
      recommendations.push("Great easy mastery! Focus on medium questions (70%+ needed) next")
    } else {
      recommendations.push("Foundations solid! Hard questions now contribute to A* potential")
    }

    return recommendations
  }

  const recommendations = getSmartRecommendations()

  // IMPROVED: Smart action logic that follows the data
  const getSmartPrimaryAction = () => {
    if (!availability || availability.total === 0) {
      return {
        button: (
          <Badge variant="secondary" className="text-gray-500 w-full justify-center py-3">
            No Questions Available
          </Badge>
        ),
        explanation: "No questions available for this subtopic"
      }
    }

    const totalQuestions = progress?.questions_attempted || 0
    
    // Priority 1: Insufficient data - build baseline
    if (totalQuestions < 12) {
      const needed = 12 - totalQuestions
      return {
        button: (
          <Link href={`/quiz/assessment/${subtopic.id}`}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg">
              <Target className="h-5 w-5 mr-3" />
              Build Data Baseline ({totalQuestions}/12)
            </Button>
          </Link>
        ),
        explanation: `Need ${needed} more questions for accurate assessment`
      }
    }

    // Priority 2: Foundation building
    if (!masteryData?.foundation.easyMastered && progress) {
      if (progress.easy_questions_attempted < 8) {
        return {
          button: (
            <Link href={`/quiz/practice/${subtopic.id}?focus=easy`}>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 rounded-lg">
                <BookOpen className="h-5 w-5 mr-3" />
                Master Easy Questions
              </Button>
            </Link>
          ),
          explanation: "Easy mastery (80%+) needed before advancing"
        }
      }
    }

    // Priority 3: Medium development
    if (masteryData?.foundation.easyMastered && !masteryData?.foundation.mediumMastered) {
      return {
        button: (
          <Link href={`/quiz/practice/${subtopic.id}?focus=medium`}>
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 rounded-lg">
              <TrendingUp className="h-5 w-5 mr-3" />
              Focus Medium Questions
            </Button>
          </Link>
        ),
        explanation: "Medium mastery (70%+) unlocks advanced weighting"
      }
    }

    // Priority 4: Advanced level actions
    if (masteryData?.foundation.readyForAdvanced) {
      if (masteryInfo.level >= 4) {
        return {
          button: (
            <Link href={`/quiz/mastery/${subtopic.id}`}>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg">
                <Award className="h-5 w-5 mr-3" />
                Attempt Mastery Level
              </Button>
            </Link>
          ),
          explanation: "Ready for mastery validation (90%+ target)"
        }
      } else {
        return {
          button: (
            <Link href={`/quiz/practice/${subtopic.id}?focus=hard`}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg">
                <Star className="h-5 w-5 mr-3" />
                Practice Hard Questions
              </Button>
            </Link>
          ),
          explanation: "Hard questions now boost A* potential"
        }
      }
    }

    // Fallback: General practice
    return {
      button: (
        <Link href={`/quiz/practice/${subtopic.id}`}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg">
            <BookOpen className="h-5 w-5 mr-3" />
            Continue Practice
          </Button>
        </Link>
      ),
      explanation: "Keep practicing to improve your level"
    }
  }

  const primaryAction = getSmartPrimaryAction()

  // Alternative actions (2-3 max, clear and relevant)
  const getAlternativeActions = () => {
    const actions = []
    const totalQuestions = progress?.questions_attempted || 0
    
    if (totalQuestions >= 8 && totalQuestions < 20) {
      actions.push({
        label: "Mixed Practice",
        url: `/quiz/practice/${subtopic.id}`,
        description: "All difficulty levels"
      })
    }
    
    if (!progress?.baseline_assessment_completed) {
      actions.push({
        label: "Full Assessment", 
        url: `/quiz/assessment/${subtopic.id}`,
        description: "Comprehensive evaluation"
      })
    }
    
    if (masteryInfo.level >= 3) {
      actions.push({
        label: "Quick Review",
        url: `/quiz/review/${subtopic.id}`,
        description: "Maintain current level"
      })
    }
    
    return actions.slice(0, 2) // Max 2 alternatives
  }

  const alternativeActions = getAlternativeActions()

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border rounded-xl bg-white">
      <CardContent className="p-8"> {/* Increased padding for more space */}
        {/* TWO-COLUMN LAYOUT with MORE SPACING: 2/3 + 1/3 */}
        <div className="grid grid-cols-3 gap-10"> {/* Increased gap from 6 to 10 */}
          
          {/* LEFT COLUMN (2/3): Title + Performance + Foundation + Analysis */}
          <div className="col-span-2 space-y-6"> {/* Increased spacing from 4 to 6 */}
            {/* Title and Subtitle with Icon */}
            <div className="flex items-start gap-4"> {/* Increased gap */}
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"> {/* Larger icon */}
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {subtopic.subtopic_code} {subtopic.title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {subtopic.description}
                </p>
              </div>
            </div>

            {/* Core/Extended Performance Data */}
            {progress && progress.questions_attempted > 0 && (
              <div className="grid grid-cols-2 gap-8 py-4 border-t border-gray-100"> {/* Increased spacing */}
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

            {/* IMPROVED: Foundation Analysis - Stacked Vertically */}
            {masteryData && progress && progress.questions_attempted > 0 && (
              <div className="py-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Foundation Analysis (All Questions)
                </h4>
                <div className="space-y-3"> {/* Changed from grid to vertical stack */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Easy Questions:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{masteryData.foundation.easyMastery}%</span>
                      <span className="text-xs text-gray-500">({progress.easy_questions_attempted}Q)</span>
                      {masteryData.foundation.easyMastered && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Medium Questions:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{masteryData.foundation.mediumMastery}%</span>
                      <span className="text-xs text-gray-500">({progress.medium_questions_attempted}Q)</span>
                      {masteryData.foundation.mediumMastered && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Hard Questions:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{masteryData.foundation.hardMastery}%</span>
                      <span className="text-xs text-gray-500">({progress.hard_questions_attempted}Q)</span>
                      {masteryData.foundation.readyForAdvanced && masteryData.foundation.hardMastery >= 70 && <Star className="h-4 w-4 text-yellow-600" />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Smart Analysis */}
            {analysis && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg"> {/* Increased padding */}
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-blue-900 mb-1">Smart Analysis:</div>
                    <div className="text-sm text-blue-800 leading-relaxed">{analysis}</div>
                  </div>
                </div>
              </div>
            )}

            {/* A* Potential Indicator */}
            {masteryData && masteryData.examReadiness.aStarPotential > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <div className="text-sm">
                    <span className="font-semibold text-yellow-900">A* Potential: </span>
                    <span className="text-yellow-800 font-medium">{masteryData.examReadiness.aStarPotential}%</span>
                    <span className="text-xs text-yellow-700 ml-2">
                      (Based on {progress?.questions_attempted || 0} questions)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (1/3): Level + Actions + Status */}
          <div className="col-span-1 space-y-6"> {/* Increased spacing */}
            {/* Level Display */}
            <div className="text-center space-y-3"> {/* Added space-y-3 */}
              <div className="text-4xl font-bold text-gray-900">{/* Larger text */}
                Level {masteryInfo.level}
              </div>
              <Badge className={`text-sm font-medium px-4 py-2 ${masteryInfo.color}`}>
                {masteryInfo.label}
              </Badge>
              
              {/* MOVED: Advanced Weighting Status */}
              {masteryData && progress && progress.questions_attempted > 0 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {masteryData.foundation.readyForAdvanced ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                      <Unlock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Advanced Unlocked</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <Lock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Foundations First</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Data confidence */}
              {masteryData && masteryData.current.confidence.level !== 'high' && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{masteryData.current.confidence.questionsUsed}/12+ questions</span>
                </div>
              )}
              
              <p className="text-xs text-gray-600 leading-relaxed px-2">
                {masteryInfo.description}
              </p>
            </div>

            {/* IMPROVED: Consolidated Action Design */}
            <div className="space-y-4">
              {/* Primary Action */}
              <div className="space-y-2">
                {primaryAction.button}
                <p className="text-xs text-gray-500 text-center px-2">
                  {primaryAction.explanation}
                </p>
              </div>

              {/* Alternative Actions */}
              {alternativeActions.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 text-center">
                    Other Options
                  </div>
                  <div className="space-y-2">
                    {alternativeActions.map((action, index) => (
                      <Link key={index} href={action.url}>
                        <div className="flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                          <div>
                            <div className="font-medium">{action.label}</div>
                            <div className="text-xs text-gray-500">{action.description}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Recommendations */}
            {recommendations.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Recommendations
                </h4>
                <div className="space-y-2">
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
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
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
