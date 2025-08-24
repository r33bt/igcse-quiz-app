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
  Unlock,
  Play,
  Zap,
  Brain
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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

// Compact performance section for colored boxes
const CompactPerformanceBox = ({ 
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
  <div className={`p-4 rounded-lg border ${color}`}>
    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">{title}</h4>
    <div className="space-y-2">
      {Object.entries(data).map(([difficulty, values]) => {
        const [correct, attempted] = values as [number, number]
        const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
        const isMastered = masteryStatus && masteryStatus[difficulty as keyof typeof masteryStatus]
        
        return (
          <div key={difficulty} className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 capitalize">{difficulty}:</span>
              {isMastered && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-900">{correct}/{attempted}</span>
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
        extended: { easy: [0, 0], medium: [0, 0], hard: [0, 0] },
        all: { easy: [0, 0], medium: [0, 0], hard: [0, 0] }
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
      },
      // NEW: All Questions breakdown
      all: {
        easy: [progress.easy_questions_correct, progress.easy_questions_attempted],
        medium: [progress.medium_questions_correct, progress.medium_questions_attempted],
        hard: [progress.hard_questions_correct, progress.hard_questions_attempted]
      }
    }
  }

  const performanceData = getPerformanceData()

  // Dynamic smart analysis based on actual data
  const getDynamicSmartAnalysis = () => {
    if (!masteryData || !progress || progress.questions_attempted === 0) {
      return "Take your first assessment to begin analyzing your performance patterns and learning trajectory."
    }

    const { foundation } = masteryData
    const totalQuestions = progress.questions_attempted
    
    if (totalQuestions < 12) {
      return `Building baseline with ${totalQuestions} questions. Need ${12 - totalQuestions} more for reliable assessment. Early indicators show ${foundation.easyMastery}% easy accuracy - foundation development in progress.`
    } 
    
    if (foundation.easyMastered && foundation.mediumMastered) {
      return `Strong foundations confirmed (${totalQuestions} questions). Easy: ${foundation.easyMastery}%, Medium: ${foundation.mediumMastery}%. Advanced weighting now active - hard questions boost A* potential significantly.`
    } 
    
    if (foundation.easyMastered) {
      return `Easy mastery achieved (${foundation.easyMastery}% from ${progress.easy_questions_attempted}Q). Medium questions (${foundation.mediumMastery}% from ${progress.medium_questions_attempted}Q) are the key to unlocking advanced progression.`
    } 
    
    return `Developing foundations. Easy accuracy ${foundation.easyMastery}% needs improvement to 80%+ before medium/hard contributions reach full potential. Focus on fundamentals first.`
  }

  const analysis = getDynamicSmartAnalysis()

  // Get synced recommendations and action options
  const getRecommendationsAndActions = () => {
    const totalQuestions = progress?.questions_attempted || 0
    
    if (!masteryData || !progress) {
      return {
        recommendations: ["Begin with assessment to establish your learning baseline and identify strengths."],
        actions: [
          {
            id: 'assessment',
            title: "Start Assessment",
            description: "I'll establish your baseline performance across all difficulty levels",
            url: `/quiz/assessment/${subtopic.id}`,
            icon: Target,
            recommended: true
          },
          {
            id: 'practice',
            title: "Practice Questions", 
            description: "I'll start practicing mixed questions right away",
            url: `/quiz/practice/${subtopic.id}`,
            icon: BookOpen,
            recommended: false
          },
          {
            id: 'review',
            title: "Review Concepts",
            description: "I'll review the key concepts first before practicing",
            url: `/quiz/review/${subtopic.id}`,
            icon: Brain,
            recommended: false
          }
        ]
      }
    }

    let recommendations = []
    let actions = []

    if (totalQuestions < 12) {
      recommendations = [
        `Take ${12 - totalQuestions} more questions for reliable level assessment`,
        "Focus on building solid foundations before advancing to harder topics"
      ]
      
      actions = [
        {
          id: 'foundation',
          title: "Build Foundation", 
          description: `I need ${12 - totalQuestions} more questions for accurate assessment`,
          url: `/quiz/practice/${subtopic.id}?focus=easy`,
          icon: Target,
          recommended: true
        },
        {
          id: 'mixed',
          title: "Mixed Practice",
          description: "I want to practice all difficulty levels together",
          url: `/quiz/practice/${subtopic.id}`,
          icon: Brain,
          recommended: false
        },
        {
          id: 'assessment',
          title: "Take Assessment",
          description: "I want a comprehensive evaluation right now", 
          url: `/quiz/assessment/${subtopic.id}`,
          icon: BookOpen,
          recommended: false
        }
      ]
    } else if (!masteryData.foundation.easyMastered) {
      recommendations = [
        "Master easy questions first - 80%+ accuracy unlocks next level",
        "Strong foundations are essential for A* exam success"
      ]
      
      actions = [
        {
          id: 'easy',
          title: "Master Easy Questions",
          description: "I need to strengthen my foundations first (80%+ target)",
          url: `/quiz/practice/${subtopic.id}?focus=easy`,
          icon: Target,
          recommended: true
        },
        {
          id: 'mixed',
          title: "Practice All Levels",
          description: "I want to work on easy, medium, and hard together",
          url: `/quiz/practice/${subtopic.id}`,
          icon: Brain,
          recommended: false
        },
        {
          id: 'review',
          title: "Review Concepts",
          description: "I want to review theory before more practice",
          url: `/quiz/review/${subtopic.id}`,
          icon: BookOpen,
          recommended: false
        }
      ]
    } else if (!masteryData.foundation.mediumMastered) {
      recommendations = [
        "Excellent easy mastery! Focus on medium questions next",
        "70%+ medium accuracy activates advanced weighting system"
      ]
      
      actions = [
        {
          id: 'medium',
          title: "Master Medium Questions",
          description: "I'm ready to tackle medium difficulty (70%+ target)",
          url: `/quiz/practice/${subtopic.id}?focus=medium`,
          icon: TrendingUp,
          recommended: true
        },
        {
          id: 'mixed', 
          title: "Practice All Levels",
          description: "I want to work on easy, medium, and hard together",
          url: `/quiz/practice/${subtopic.id}`,
          icon: Brain,
          recommended: false
        },
        {
          id: 'hard',
          title: "Challenge Hard Questions",
          description: "I feel confident enough to try hard questions",
          url: `/quiz/practice/${subtopic.id}?focus=hard`,
          icon: Star,
          recommended: false
        }
      ]
    } else {
      recommendations = [
        "Foundations complete - hard questions now contribute to A* potential", 
        "Maintain consistency across all difficulty levels for mastery"
      ]
      
      actions = [
        {
          id: 'hard',
          title: "A* Challenge",
          description: "I'm ready for hard questions to boost my A* potential",
          url: `/quiz/practice/${subtopic.id}?focus=hard`,
          icon: Star,
          recommended: true
        },
        {
          id: 'mastery',
          title: "Mastery Quiz",
          description: "I want to prove I've mastered this topic completely",
          url: `/quiz/mastery/${subtopic.id}`,
          icon: Award,
          recommended: false
        },
        {
          id: 'maintain',
          title: "Review & Maintain",
          description: "I want to keep my current level with periodic practice",
          url: `/quiz/review/${subtopic.id}`,
          icon: RefreshCw,
          recommended: false
        }
      ]
    }

    return { recommendations, actions }
  }

  const { recommendations, actions } = getRecommendationsAndActions()
  
  // FIX: Initialize with the recommended action ID
  const defaultActionId = actions.find(a => a.recommended)?.id || actions[0].id
  const [selectedAction, setSelectedAction] = useState(defaultActionId)
  const currentAction = actions.find(a => a.id === selectedAction) || actions[0]

  // IMPROVED: Better A* Potential Logic
  const getAStarPotentialDisplay = () => {
    if (!masteryData || !progress || progress.questions_attempted < 20) {
      return null // Don't show A* potential until sufficient data
    }

    const { foundation, examReadiness } = masteryData
    const confidence = progress.questions_attempted >= 30 ? 'High' : 
                     progress.questions_attempted >= 20 ? 'Medium' : 'Low'
    
    let context = ""
    if (foundation.readyForAdvanced) {
      context = "Strong foundations boost A* chances significantly"
    } else if (foundation.easyMastered) {
      context = "Easy mastery achieved - medium focus needed for A* track"
    } else {
      context = "Foundation building phase - A* potential will increase with mastery"
    }

    return {
      potential: examReadiness.aStarPotential,
      confidence,
      context,
      questionsUsed: progress.questions_attempted
    }
  }

  const aStarDisplay = getAStarPotentialDisplay()

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border rounded-xl bg-white">
      <CardContent className="p-8">
        {/* IMPROVED LAYOUT: Better column proportions */}
        <div className="grid grid-cols-5 gap-10"> {/* Changed from grid-cols-3 to grid-cols-5 for better balance */}
          
          {/* LEFT COLUMN (3/5): More space for content */}
          <div className="col-span-3 space-y-6">
            {/* Title and Subtitle */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
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

            {/* IMPROVED: Performance Data with All Questions */}
            {progress && progress.questions_attempted > 0 && (
              <div className="bg-gray-50 p-5 rounded-lg border">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance Breakdown
                </h4>
                
                {/* Core/Extended/All Questions in grid */}
                <div className="grid grid-cols-3 gap-4">
                  <CompactPerformanceBox
                    title="Core"
                    data={performanceData.core}
                    color="bg-blue-50 border-blue-200"
                    masteryStatus={masteryData ? {
                      easy: masteryData.foundation.easyMastered,
                      medium: masteryData.foundation.mediumMastered,
                      hard: masteryData.foundation.readyForAdvanced && masteryData.foundation.hardMastery >= 70
                    } : undefined}
                  />
                  <CompactPerformanceBox
                    title="Extended" 
                    data={performanceData.extended}
                    color="bg-purple-50 border-purple-200"
                    masteryStatus={masteryData ? {
                      easy: masteryData.foundation.easyMastered,
                      medium: masteryData.foundation.mediumMastered,
                      hard: masteryData.foundation.readyForAdvanced && masteryData.foundation.hardMastery >= 70
                    } : undefined}
                  />
                  <CompactPerformanceBox
                    title="All Questions" 
                    data={performanceData.all}
                    color="bg-green-50 border-green-200"
                    masteryStatus={masteryData ? {
                      easy: masteryData.foundation.easyMastered,
                      medium: masteryData.foundation.mediumMastered,
                      hard: masteryData.foundation.readyForAdvanced && masteryData.foundation.hardMastery >= 70
                    } : undefined}
                  />
                </div>
              </div>
            )}

            {/* Recommendations Box */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                What You Should Focus On
              </h4>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className="text-sm text-green-800 leading-relaxed">
                    • {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Analysis Box */}
            {analysis && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-blue-900 mb-1">Smart Analysis:</div>
                  <div className="text-sm text-blue-800 leading-relaxed">{analysis}</div>
                </div>
              </div>
            )}

            {/* IMPROVED: A* Potential with Better Context */}
            {aStarDisplay && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold text-yellow-900 mb-1">A* Potential: {aStarDisplay.potential}%</div>
                  <div className="text-yellow-800 mb-1">{aStarDisplay.context}</div>
                  <div className="text-xs text-yellow-700">
                    {aStarDisplay.confidence} confidence • Based on {aStarDisplay.questionsUsed} questions
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (2/5): More space for actions */}
          <div className="col-span-2 space-y-6">
            {/* FIXED: Level Display - No wrapping */}
            <div className="text-center space-y-3">
              <div className="flex items-start justify-center gap-3">
                <div className="text-4xl font-bold text-gray-900">Level</div>
                <div className="flex flex-col items-start">
                  <div className="text-4xl font-bold text-gray-900">{masteryInfo.level}</div>
                  <Badge className={`text-xs px-2 py-1 mt-1 ${masteryInfo.color}`}>
                    {masteryInfo.label}
                  </Badge>
                  {masteryData && progress && progress.questions_attempted > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {masteryData.foundation.readyForAdvanced ? (
                        <>
                          <Unlock className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Advanced</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">Foundations First</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* IMPROVED: Action Selection with better heading */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-4">
                Select Your Learning Path
              </h4>
              
              {/* FIXED: Radio Options with proper selection */}
              <div className="space-y-3 mb-4">
                {actions.map((action) => (
                  <label key={action.id} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="learningPath"
                      value={action.id}
                      checked={selectedAction === action.id}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${selectedAction === action.id ? 'text-blue-900' : 'text-blue-700'} group-hover:text-blue-900`}>
                        {action.title} {action.recommended && <span className="text-xs text-blue-600 font-semibold">(Recommended)</span>}
                      </div>
                      <div className={`text-xs leading-relaxed ${selectedAction === action.id ? 'text-blue-800' : 'text-blue-600'}`}>
                        {action.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* IMPROVED: Generic Action Button */}
              <Link href={currentAction.url}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <Play className="h-5 w-5 mr-3" />
                  <span className="text-base">Start Learning</span>
                </Button>
              </Link>
            </div>

            {/* Simple metadata */}
            {progress?.last_practiced && (
              <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                <Clock className="h-3 w-3 inline mr-1" />
                Last practiced: {new Date(progress.last_practiced).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
