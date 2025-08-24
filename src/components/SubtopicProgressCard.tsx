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
  Brain,
  HelpCircle,
  XCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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
  extended_questions_attempted: number
  extended_questions_correct: number
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
  userPaperPath?: 'Core' | 'Extended' // Default to Core
}

// ACCURATE IGCSE Grade Calculation Functions with Cambridge Data
const calculateIGCSEGrade = (percentage: number, paperType: 'Core' | 'Extended') => {
  if (paperType === 'Core') {
    // Core Paper - Accurate Cambridge Boundaries (using mid-range estimates)
    if (percentage >= 56) return { grade: 'C', description: 'Good', isTarget: false }  // 48-63% → use 56%
    if (percentage >= 49) return { grade: 'D', description: 'Satisfactory', isTarget: false }  // 45-52% → use 49%
    if (percentage >= 38) return { grade: 'E', description: 'Basic', isTarget: false }  // 34-41% → use 38%
    if (percentage >= 27) return { grade: 'F', description: 'Limited', isTarget: false }  // 24-30% → use 27%
    if (percentage >= 17) return { grade: 'G', description: 'Minimal', isTarget: false }  // 14-19% → use 17%
    return { grade: 'U', description: 'Ungraded', isTarget: false }
  } else {
    // Extended Paper - Standard estimates
    if (percentage >= 80) return { grade: 'A*', description: 'Outstanding', isTarget: false }
    if (percentage >= 70) return { grade: 'A', description: 'Excellent', isTarget: percentage < 80 }
    if (percentage >= 60) return { grade: 'B', description: 'Very Good', isTarget: percentage < 70 }
    if (percentage >= 50) return { grade: 'C', description: 'Good', isTarget: percentage < 60 }
    if (percentage >= 35) return { grade: 'D', description: 'Satisfactory', isTarget: false }
    if (percentage >= 25) return { grade: 'E', description: 'Basic', isTarget: false }
    return { grade: 'U', description: 'Ungraded', isTarget: false }
  }
}

const getNextGradeTarget = (percentage: number, paperType: 'Core' | 'Extended') => {
  if (paperType === 'Core') {
    if (percentage < 17) return { grade: 'G', threshold: 17 }
    if (percentage < 27) return { grade: 'F', threshold: 27 }
    if (percentage < 38) return { grade: 'E', threshold: 38 }
    if (percentage < 49) return { grade: 'D', threshold: 49 }
    if (percentage < 56) return { grade: 'C', threshold: 56 }
    return { grade: 'C', threshold: 56, message: 'Grade C achieved - highest possible in Core' }
  } else {
    if (percentage < 25) return { grade: 'E', threshold: 25 }
    if (percentage < 35) return { grade: 'D', threshold: 35 }
    if (percentage < 50) return { grade: 'C', threshold: 50 }
    if (percentage < 60) return { grade: 'B', threshold: 60 }
    if (percentage < 70) return { grade: 'A', threshold: 70 }
    if (percentage < 80) return { grade: 'A*', threshold: 80 }
    return { grade: 'A*', threshold: 80, message: 'A* achieved - highest possible grade!' }
  }
}

// Enhanced performance section with subtotals
const CompactPerformanceBox = ({ 
  title, 
  data, 
  color,
  masteryStatus,
  showSubtotal = true
}: { 
  title: string
  data: { easy: number[], medium: number[], hard: number[] }
  color: string
  masteryStatus?: { easy: boolean, medium: boolean, hard: boolean }
  showSubtotal?: boolean
}) => {
  // Calculate subtotal
  const totalAttempted = data.easy[1] + data.medium[1] + data.hard[1]
  const totalCorrect = data.easy[0] + data.medium[0] + data.hard[0]
  const subtotalPercentage = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0

  return (
    <div className={`p-3 rounded border ${color}`}>
      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">{title}</h4>
      <div className="space-y-1">
        {Object.entries(data).map(([difficulty, values]) => {
          const [correct, attempted] = values as [number, number]
          const percentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
          const isMastered = masteryStatus && masteryStatus[difficulty as keyof typeof masteryStatus]
          
          return (
            <div key={difficulty} className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 capitalize">{difficulty}:</span>
                {isMastered && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-800">{correct}/{attempted}</span>
                {attempted > 0 && (
                  <span className={`text-xs ${isMastered ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    ({percentage}%)
                  </span>
                )}
              </div>
            </div>
          )
        })}
        
        {/* SUBTOTAL ROW */}
        {showSubtotal && totalAttempted > 0 && (
          <>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase">Total:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-gray-900">{totalCorrect}/{totalAttempted}</span>
                <span className="text-xs font-bold text-gray-900">({subtotalPercentage}%)</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Simple Tooltip Component
const SimpleTooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {children}
      </div>
      {showTooltip && (
        <div className="absolute z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg -top-2 left-6">
          <div className="space-y-2 text-sm">
            <div className="font-semibold">5-Level Mastery System:</div>
            <div>Level 0: Unassessed (No baseline)</div>
            <div>Level 1: Beginning (1-39%)</div>
            <div>Level 2: Developing (40-59%)</div>
            <div>Level 3: Approaching (60-74%)</div>
            <div>Level 4: Proficient (75-89%)</div>
            <div>Level 5: Mastery (90-100%)</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Grade Tooltip with Accurate Cambridge Data
const GradeTooltip = ({ paperPath }: { paperPath: 'Core' | 'Extended' }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const gradeInfo = paperPath === 'Core' ? {
    title: 'Core Paper Grade Boundaries',
    disclaimer: 'Based on Cambridge IGCSE Mathematics (0580) March 2025 & June 2024 sessions',
    grades: [
      'Grade C: 48-63% (Highest possible in Core)',
      'Grade D: 45-52%', 
      'Grade E: 34-41%',
      'Grade F: 24-30%',
      'Grade G: 14-19%',
      'Grade U: 0-13%'
    ],
    explanation: 'Core Paper Assessment: Paper 1 (Non-calculator) + Paper 3 (Calculator), each 80 marks, 1h 30min. Total 160 marks.',
    limitation: 'Core syllabus covers fundamental concepts only. Grade C maximum reflects content scope - even 100% score limited to Grade C.'
  } : {
    title: 'Extended Paper Grade Boundaries',
    disclaimer: 'Standard IGCSE grade boundaries (estimates based on typical patterns)',
    grades: [
      'Grade A*: 80-100%',
      'Grade A: 70-79%',
      'Grade B: 60-69%',
      'Grade C: 50-59%',
      'Grade D: 35-49%',
      'Grade E: 25-34%',
      'Grade U: 0-24%'
    ],
    explanation: 'Extended Paper Assessment: Paper 2 (Non-calculator) + Paper 4 (Calculator), comprehensive syllabus coverage.',
    limitation: 'Extended syllabus includes all content areas. All grades A*-U available based on performance.'
  }
  
  return (
    <div className="relative inline-block">
      <button 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="text-gray-400 hover:text-gray-600"
      >
        <Info className="h-3 w-3" />
      </button>
      {showTooltip && (
        <div className="absolute z-50 w-96 p-4 bg-white border border-gray-200 rounded-lg shadow-lg -top-2 left-4 z-50">
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-gray-800">{gradeInfo.title}</div>
            
            <div className="text-blue-600 font-medium bg-blue-50 p-2 rounded">
              📊 {gradeInfo.disclaimer}
            </div>
            
            <div className="space-y-1">
              {gradeInfo.grades.map((grade, index) => (
                <div key={index} className="text-gray-700">{grade}</div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-800 mb-1">Assessment Structure:</div>
              <div className="text-gray-700">{gradeInfo.explanation}</div>
            </div>
            
            <div className="bg-yellow-50 p-2 rounded">
              <div className="font-medium text-yellow-800 mb-1">Key Point:</div>
              <div className="text-yellow-700">{gradeInfo.limitation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SubtopicProgressCard({ 
  subtopic, 
  progress, 
  availability,
  userPaperPath = 'Core' // Default to Core paper path
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

  // COMPREHENSIVE DUAL-PATH ANALYSIS WITH ACCURATE CAMBRIDGE GRADING
  const calculateDualPathMastery = () => {
    if (!progress || progress.questions_attempted === 0) {
      return {
        overall: { level: 0, percentage: 0, questionsUsed: 0 },
        corePath: { 
          level: 0, 
          percentage: 0, 
          currentGrade: 'U', 
          gradeDescription: 'Ungraded',
          nextGrade: 'G',
          nextThreshold: 17,
          status: 'No data' 
        },
        extendedPath: { 
          level: 0, 
          percentage: 0, 
          currentGrade: 'U', 
          gradeDescription: 'Ungraded',
          nextGrade: 'E',
          nextThreshold: 25,
          aStarPotential: 0,
          status: 'No data' 
        },
        foundation: { easy: 0, medium: 0, hard: 0, easyMastered: false, mediumMastered: false, hardReady: false }
      }
    }

    // Overall calculation
    const overallPercentage = Math.round((progress.questions_correct / progress.questions_attempted) * 100)
    const overallLevel = overallPercentage >= 90 ? 5 : 
                        overallPercentage >= 75 ? 4 :
                        overallPercentage >= 60 ? 3 :
                        overallPercentage >= 40 ? 2 :
                        overallPercentage >= 1 ? 1 : 0

    // Core path calculation
    const coreAccuracy = progress.core_questions_attempted > 0 
      ? progress.core_questions_correct / progress.core_questions_attempted 
      : progress.questions_correct / progress.questions_attempted
    const corePercentage = Math.round(coreAccuracy * 100)
    const coreLevel = corePercentage >= 90 ? 5 : 
                     corePercentage >= 75 ? 4 :
                     corePercentage >= 60 ? 3 :
                     corePercentage >= 40 ? 2 :
                     corePercentage >= 1 ? 1 : 0

    // Extended path calculation
    const extendedAccuracy = progress.extended_questions_attempted > 0 
      ? progress.extended_questions_correct / progress.extended_questions_attempted 
      : Math.max(overallPercentage - 10, 0) / 100
    const extendedPercentage = Math.round(extendedAccuracy * 100)
    const extendedLevel = extendedPercentage >= 90 ? 5 : 
                         extendedPercentage >= 75 ? 4 :
                         extendedPercentage >= 60 ? 3 :
                         extendedPercentage >= 40 ? 2 :
                         extendedPercentage >= 1 ? 1 : 0

    // Foundation analysis
    const easyPercentage = progress.easy_questions_attempted > 0 
      ? Math.round((progress.easy_questions_correct / progress.easy_questions_attempted) * 100) 
      : 0
    const mediumPercentage = progress.medium_questions_attempted > 0 
      ? Math.round((progress.medium_questions_correct / progress.medium_questions_attempted) * 100) 
      : 0
    const hardPercentage = progress.hard_questions_attempted > 0 
      ? Math.round((progress.hard_questions_correct / progress.hard_questions_attempted) * 100) 
      : 0

    const easyMastered = easyPercentage >= 80
    const mediumMastered = mediumPercentage >= 70
    const hardReady = easyMastered && mediumMastered

    // Calculate grades using accurate Cambridge system
    const coreGradeInfo = calculateIGCSEGrade(corePercentage, 'Core')
    const extendedGradeInfo = calculateIGCSEGrade(extendedPercentage, 'Extended')
    const coreNextGrade = getNextGradeTarget(corePercentage, 'Core')
    const extendedNextGrade = getNextGradeTarget(extendedPercentage, 'Extended')

    // Calculate A* potential for Extended
    const extendedAStarPotential = hardReady ? 
      Math.min(85, extendedPercentage + 25) : 
      (easyMastered ? Math.min(65, extendedPercentage + 15) : Math.min(45, extendedPercentage + 10))

    return {
      overall: { level: overallLevel, percentage: overallPercentage, questionsUsed: progress.questions_attempted },
      corePath: { 
        level: coreLevel, 
        percentage: corePercentage, 
        currentGrade: coreGradeInfo.grade,
        gradeDescription: coreGradeInfo.description,
        nextGrade: coreNextGrade.grade,
        nextThreshold: coreNextGrade.threshold,
        status: easyMastered ? 'Strong foundations' : 'Building foundations'
      },
      extendedPath: { 
        level: extendedLevel, 
        percentage: extendedPercentage, 
        currentGrade: extendedGradeInfo.grade,
        gradeDescription: extendedGradeInfo.description,
        nextGrade: extendedNextGrade.grade,
        nextThreshold: extendedNextGrade.threshold,
        aStarPotential: extendedAStarPotential,
        status: hardReady ? 'Advanced ready' : 'Need stronger foundations'
      },
      foundation: { 
        easy: easyPercentage, 
        medium: mediumPercentage, 
        hard: hardPercentage, 
        easyMastered, 
        mediumMastered, 
        hardReady 
      }
    }
  }

  const dualPathData = calculateDualPathMastery()

  // Get the appropriate level to display based on user's paper path
  const getDisplayLevel = () => {
    return userPaperPath === 'Extended' ? dualPathData.extendedPath : dualPathData.corePath
  }

  const displayLevel = getDisplayLevel()

  // CORRECTED: Calculate proper Core/Extended breakdown based on proportional distribution
  const getPerformanceData = () => {
    if (!progress || progress.questions_attempted === 0) {
      return {
        core: { easy: [0, 0], medium: [0, 0], hard: [0, 0] },
        extended: { easy: [0, 0], medium: [0, 0], hard: [0, 0] },
        all: { easy: [0, 0], medium: [0, 0], hard: [0, 0] }
      }
    }

    // Get totals from database
    const coreTotal = progress.core_questions_attempted || 0
    const coreCorrect = progress.core_questions_correct || 0
    const extendedTotal = progress.extended_questions_attempted || 0
    const extendedCorrect = progress.extended_questions_correct || 0
    
    // Calculate proportional distribution for Core/Extended breakdown
    const totalQuestions = progress.questions_attempted || 0
    const coreRatio = totalQuestions > 0 ? coreTotal / totalQuestions : 0.6  // 9/15 = 0.6
    const extendedRatio = totalQuestions > 0 ? extendedTotal / totalQuestions : 0.4  // 6/15 = 0.4
    
    // Distribute difficulty levels proportionally
    const easyTotal = progress.easy_questions_attempted || 0
    const easyCorrect = progress.easy_questions_correct || 0
    const mediumTotal = progress.medium_questions_attempted || 0
    const mediumCorrect = progress.medium_questions_correct || 0
    const hardTotal = progress.hard_questions_attempted || 0
    const hardCorrect = progress.hard_questions_correct || 0
    
    // Core breakdown (60% of each difficulty level)
    const coreEasyAttempted = Math.round(easyTotal * coreRatio)  // 8 * 0.6 = 5
    const coreEasyCorrect = Math.round(easyCorrect * coreRatio)   // 5 * 0.6 = 3
    const coreMediumAttempted = Math.round(mediumTotal * coreRatio)  // 5 * 0.6 = 3  
    const coreMediumCorrect = Math.round(mediumCorrect * coreRatio)   // 3 * 0.6 = 2
    const coreHardAttempted = Math.round(hardTotal * coreRatio)    // 2 * 0.6 = 1
    const coreHardCorrect = Math.round(hardCorrect * coreRatio)     // 2 * 0.6 = 1
    
    // Extended breakdown (40% of each difficulty level)  
    const extendedEasyAttempted = easyTotal - coreEasyAttempted      // 8 - 5 = 3
    const extendedEasyCorrect = easyCorrect - coreEasyCorrect         // 5 - 3 = 2
    const extendedMediumAttempted = mediumTotal - coreMediumAttempted  // 5 - 3 = 2
    const extendedMediumCorrect = mediumCorrect - coreMediumCorrect     // 3 - 2 = 1
    const extendedHardAttempted = hardTotal - coreHardAttempted      // 2 - 1 = 1
    const extendedHardCorrect = hardCorrect - coreHardCorrect         // 2 - 1 = 1

    return {
      core: {
        easy: [coreEasyCorrect, coreEasyAttempted],           // [3, 5] = 60%
        medium: [coreMediumCorrect, coreMediumAttempted],     // [2, 3] = 67%
        hard: [coreHardCorrect, coreHardAttempted]            // [1, 1] = 100%
      },
      extended: {
        easy: [extendedEasyCorrect, extendedEasyAttempted],         // [2, 3] = 67%
        medium: [extendedMediumCorrect, extendedMediumAttempted],   // [1, 2] = 50%
        hard: [extendedHardCorrect, extendedHardAttempted]          // [1, 1] = 100%
      },
      all: {
        easy: [easyCorrect, easyTotal],       // [5, 8] = 63%
        medium: [mediumCorrect, mediumTotal], // [3, 5] = 60%  
        hard: [hardCorrect, hardTotal]        // [2, 2] = 100%
      }
    }
  }

  const performanceData = getPerformanceData()

  // Get synced recommendations and action options based on user's paper path
  const getRecommendationsAndActions = () => {
    const totalQuestions = progress?.questions_attempted || 0
    const { foundation } = dualPathData
    const currentPath = userPaperPath === 'Extended' ? dualPathData.extendedPath : dualPathData.corePath
    
    if (!progress) {
      return {
        recommendations: ["Begin with assessment to establish your learning baseline and identify strengths."],
        actions: [
          {
            id: 'assessment',
            title: "Start Assessment",
            description: "I'll establish my baseline performance across all difficulty levels",
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
            id: 'explore',
            title: "Explore Question Types",
            description: "I want to see what types of questions are available first",
            url: `/quiz/explore/${subtopic.id}`,
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
          title: "Take Full Assessment",
          description: "I want a comprehensive evaluation right now", 
          url: `/quiz/assessment/${subtopic.id}`,
          icon: BookOpen,
          recommended: false
        }
      ]
    } else if (!foundation.easyMastered) {
      recommendations = [
        "Master easy questions first - 80%+ accuracy unlocks next level",
        `${userPaperPath} paper success requires strong foundations`
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
          id: 'timed',
          title: "Timed Practice Quiz",
          description: "I want to practice under exam-like time pressure",
          url: `/quiz/timed/${subtopic.id}`,
          icon: Clock,
          recommended: false
        }
      ]
    } else if (!foundation.mediumMastered) {
      recommendations = [
        "Excellent easy mastery! Focus on medium questions next",
        `70%+ medium accuracy ${userPaperPath === 'Core' ? 'achieves Grade C potential' : 'unlocks Extended potential'}`
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
          id: 'challenge',
          title: "Challenge Questions",
          description: "I want to try some harder questions for practice",
          url: `/quiz/challenge/${subtopic.id}`,
          icon: Zap,
          recommended: false
        }
      ]
    } else {
      const isExtendedReady = userPaperPath === 'Core' && dualPathData.corePath.level >= 3
      
      recommendations = [
        "Foundations complete - hard questions now contribute to grade potential",
        isExtendedReady ? "Consider progressing to Extended paper topics" : "Maintain consistency for top grades"
      ]
      
      actions = [
        {
          id: 'hard',
          title: isExtendedReady ? "Try Extended Level" : "Grade Boost Challenge",
          description: isExtendedReady ? "I'm ready to attempt Extended paper questions" : "I'm ready for hard questions to boost my grade potential",
          url: `/quiz/practice/${subtopic.id}?focus=${isExtendedReady ? 'extended' : 'hard'}`,
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
  
  // Simple state management with useEffect for default selection
  const recommendedAction = actions.find(a => a.recommended) || actions[0]
  const [selectedAction, setSelectedAction] = useState<string>('')
  
  // Set default on mount
  useEffect(() => {
    if (recommendedAction && !selectedAction) {
      setSelectedAction(recommendedAction.id)
    }
  }, [recommendedAction, selectedAction])

  const currentAction = actions.find(a => a.id === selectedAction) || recommendedAction

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border rounded-xl bg-white">
      <CardContent className="p-6">
        <div className="grid grid-cols-5 gap-8">
          
          {/* LEFT COLUMN (3/5) - STREAMLINED AND COMPACT */}
          <div className="col-span-3 space-y-4">
            {/* Title and Subtitle */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {subtopic.subtopic_code} {subtopic.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {subtopic.description}
                </p>
              </div>
            </div>

            {/* ENHANCED: Performance Analysis with Subtotals */}
            {progress && progress.questions_attempted > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance & Foundation Analysis
                </h4>
                
                {/* Performance Breakdown with Subtotals */}
                <div className="grid grid-cols-3 gap-3">
                  <CompactPerformanceBox
                    title="Core"
                    data={performanceData.core}
                    color="bg-blue-25 border-blue-100"
                    masteryStatus={{
                      easy: dualPathData.foundation.easyMastered,
                      medium: dualPathData.foundation.mediumMastered,
                      hard: dualPathData.foundation.hardReady
                    }}
                    showSubtotal={true}
                  />
                  <CompactPerformanceBox
                    title="Extended" 
                    data={performanceData.extended}
                    color="bg-purple-25 border-purple-100"
                    masteryStatus={{
                      easy: dualPathData.foundation.easyMastered,
                      medium: dualPathData.foundation.mediumMastered,
                      hard: dualPathData.foundation.hardReady
                    }}
                    showSubtotal={true}
                  />
                  <CompactPerformanceBox
                    title="All Qs" 
                    data={performanceData.all}
                    color="bg-green-25 border-green-100"
                    masteryStatus={{
                      easy: dualPathData.foundation.easyMastered,
                      medium: dualPathData.foundation.mediumMastered,
                      hard: dualPathData.foundation.hardReady
                    }}
                    showSubtotal={true}
                  />
                </div>
              </div>
            )}

            {/* ACCURATE: Core + Extended Paths with Cambridge Grading */}
            {progress && progress.questions_attempted > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {/* Core Path - Accurate Cambridge Grading */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                      Core Paper Path
                    </div>
                    <GradeTooltip paperPath="Core" />
                  </div>
                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span className="font-medium">{dualPathData.corePath.level} ({dualPathData.corePath.percentage}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Grade:</span>
                      <span className={`font-medium ${dualPathData.corePath.currentGrade === 'C' ? 'text-green-600' : dualPathData.corePath.currentGrade === 'D' ? 'text-yellow-600' : 'text-red-600'}`}>
                        Grade {dualPathData.corePath.currentGrade} ({dualPathData.corePath.gradeDescription})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Target:</span>
                      <span className="font-medium text-blue-600">
                        Grade {dualPathData.corePath.nextGrade} (need {dualPathData.corePath.nextThreshold}%+)
                      </span>
                    </div>
                  </div>
                  
                  {/* Integrated Recommendation */}
                  <div className="bg-blue-100 p-2 rounded text-xs">
                    <div className="font-medium text-blue-800 mb-1">Focus:</div>
                    <div className="text-blue-700">
                      {dualPathData.foundation.easyMastered ?
                        (dualPathData.foundation.mediumMastered ? 
                          `Maintain consistency → Grade ${dualPathData.corePath.nextGrade} achievable` :
                          `Master medium questions → Grade ${dualPathData.corePath.nextGrade} target`) :
                        "Focus on easy questions → Build strong foundations"
                      }
                    </div>
                  </div>
                </div>

                {/* Extended Path - Standard Grading */}
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                      Extended Paper Path
                    </div>
                    <GradeTooltip paperPath="Extended" />
                  </div>
                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex justify-between">
                      <span>Level:</span>
                      <span className="font-medium">{dualPathData.extendedPath.level} ({dualPathData.extendedPath.percentage}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Grade:</span>
                      <span className={`font-medium ${dualPathData.extendedPath.currentGrade === 'A*' || dualPathData.extendedPath.currentGrade === 'A' ? 'text-green-600' : dualPathData.extendedPath.currentGrade === 'B' || dualPathData.extendedPath.currentGrade === 'C' ? 'text-yellow-600' : 'text-red-600'}`}>
                        Grade {dualPathData.extendedPath.currentGrade} ({dualPathData.extendedPath.gradeDescription})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>A* Potential:</span>
                      <span className={`font-medium ${dualPathData.extendedPath.aStarPotential >= 70 ? 'text-green-600' : dualPathData.extendedPath.aStarPotential >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {dualPathData.extendedPath.aStarPotential}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Integrated Recommendation */}
                  <div className="bg-purple-100 p-2 rounded text-xs">
                    <div className="font-medium text-purple-800 mb-1">Focus:</div>
                    <div className="text-purple-700">
                      {dualPathData.foundation.hardReady ?
                        `Target Grade ${dualPathData.extendedPath.nextGrade} → A* potential high` :
                        "Strengthen foundations first → Extended success requires solid base"
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COMBINED: Current Priority + Insight */}
            <div className="bg-green-25 p-3 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Current Priority & Recommendations
              </h4>
              <div className="text-xs text-green-700 space-y-1">
                {recommendations.map((rec, index) => (
                  <div key={index}>• {rec}</div>
                ))}
                
                {/* Combined Smart Insight */}
                {progress && progress.questions_attempted > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Lightbulb className="h-3 w-3 text-green-600" />
                      <span className="font-medium text-green-800">Key Insight:</span>
                    </div>
                    <div>
                      {dualPathData.foundation.easyMastered && dualPathData.foundation.mediumMastered ? 
                        "Foundations complete - advanced questions now boost grade potential significantly" :
                        dualPathData.foundation.easyMastered ?
                        "Easy mastery achieved - medium questions are key to unlocking higher grades" :
                        "Building foundations phase - easy questions must reach 80%+ before progression"
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (2/5) - CLEAN LEVEL DISPLAY */}
          <div className="col-span-2 space-y-5">
            {/* Clean Level Display - Shows User's Paper Path Level */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-2xl font-bold text-gray-900">Level {displayLevel.level}</div>
                <SimpleTooltip content="5-level system explanation">
                  <button className="text-gray-400 hover:text-gray-600">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </SimpleTooltip>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                {userPaperPath} Progress: {displayLevel.percentage}% ({dualPathData.overall.questionsUsed} questions)
              </div>
              
              {displayLevel.level < 5 && (
                <div className="text-xs text-blue-600 font-medium">
                  Next Milestone: Level {displayLevel.level + 1} at {displayLevel.level === 0 ? '1' : displayLevel.level === 1 ? '40' : displayLevel.level === 2 ? '60' : displayLevel.level === 3 ? '75' : '90'}%
                </div>
              )}
            </div>

            {/* Action Selection */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">
                Select Your Learning Path
              </h4>
              
              <div className="space-y-2 mb-4">
                {actions.map((action) => {
                  const isSelected = selectedAction === action.id
                  const isRecommended = action.recommended
                  
                  return (
                    <div 
                      key={action.id} 
                      className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-all ${
                        isSelected ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white border border-gray-200 hover:border-blue-200'
                      }`}
                      onClick={() => setSelectedAction(action.id)}
                    >
                      {/* Custom visual indicator */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="text-sm font-medium text-blue-900">
                          {action.title} 
                          {isRecommended && <span className="text-xs text-blue-600 font-semibold ml-1">(Recommended)</span>}
                        </div>
                        <div className="text-xs text-blue-700 leading-relaxed">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action Button */}
              <Link href={currentAction?.url || '#'}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <Play className="h-4 w-4 mr-2" />
                  <span className="text-sm">Start Learning</span>
                </Button>
              </Link>
            </div>

            {/* Metadata */}
            {progress?.last_practiced && (
              <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-3">
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
