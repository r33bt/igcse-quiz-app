/**
 * Enhanced Mastery Calculation System
 * 
 * Implements a sophisticated multi-dimensional assessment that:
 * 1. Prioritizes recent performance (Current Level)
 * 2. Maintains historical context (Overall Level)  
 * 3. Uses smart conditional weighting based on foundation mastery
 * 4. Aligns with IGCSE A* exam requirements
 * 
 * Phase 1 Implementation: Core calculation logic with full documentation
 */

export interface SubtopicProgress {
  subtopic_id: string
  mastery_level: string
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

export interface MasteryLevel {
  level: number
  label: string
  color: string
  description: string
}

export interface FoundationMastery {
  easyMastery: number        // 0-100%
  mediumMastery: number      // 0-100%
  hardMastery: number        // 0-100%
  easyMastered: boolean      // >= 80%
  mediumMastered: boolean    // >= 70%
  readyForAdvanced: boolean  // Both easy and medium mastered
}

export interface PerformanceConfidence {
  level: 'high' | 'medium' | 'low' | 'insufficient'
  questionsUsed: number
  description: string
  needMoreQuestions: boolean
}

export interface ComprehensiveMasteryData {
  current: {
    level: MasteryLevel
    accuracy: number
    confidence: PerformanceConfidence
    questionsAnalyzed: number
  }
  overall: {
    level: MasteryLevel
    accuracy: number
    totalQuestions: number
  }
  foundation: FoundationMastery
  trend: {
    direction: 'improving' | 'stable' | 'declining'
    strength: 'strong' | 'moderate' | 'slight'
    description: string
  }
  examReadiness: {
    aStarPotential: number     // 0-100%
    weakestArea: 'easy' | 'medium' | 'hard' | 'balanced'
    nextMilestone: string
  }
  recommendations: string[]
}

// Configuration Constants
const CONFIG = {
  // Recent performance analysis
  RECENT_QUESTIONS_THRESHOLD: 12,     // Last N questions for current level
  MINIMUM_FOR_CONFIDENCE: 8,          // Minimum questions needed for reliable assessment
  
  // Foundation mastery thresholds (A* exam requirements)
  EASY_MASTERY_THRESHOLD: 0.80,       // 80% easy mastery required
  MEDIUM_MASTERY_THRESHOLD: 0.70,     // 70% medium mastery required
  
  // Level boundaries (accuracy percentages)
  LEVEL_BOUNDARIES: {
    MASTERY: 90,      // Level 5: 90-100%
    PROFICIENT: 75,   // Level 4: 75-89%
    APPROACHING: 60,  // Level 3: 60-74%
    DEVELOPING: 40,   // Level 2: 40-59%
    BEGINNING: 1,     // Level 1: 1-39%
    UNASSESSED: 0     // Level 0: 0%
  }
} as const

// Level definitions with rich metadata
const LEVEL_DEFINITIONS: Record<number, Omit<MasteryLevel, 'level'>> = {
  0: {
    label: 'Unassessed',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    description: 'No baseline established yet. Take an assessment to see your current level.'
  },
  1: {
    label: 'Beginning',
    color: 'bg-red-100 text-red-700 border-red-200',
    description: 'Just starting to learn the basics. Focus on fundamental concepts.'
  },
  2: {
    label: 'Developing',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: 'Building foundational understanding. Focus on core concepts and practice.'
  },
  3: {
    label: 'Approaching',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    description: 'Good progress made. Challenge yourself with harder questions.'
  },
  4: {
    label: 'Proficient',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Strong understanding demonstrated. Ready to attempt mastery.'
  },
  5: {
    label: 'Mastery',
    color: 'bg-green-100 text-green-700 border-green-200',
    description: 'Excellent command of this topic. Maintain with periodic review.'
  }
}

/**
 * Calculate foundation mastery status across difficulty levels
 * Critical for determining if hard question performance should be trusted
 */
export function assessFoundationMastery(progress: SubtopicProgress): FoundationMastery {
  const easyMastery = progress.easy_questions_attempted > 0 
    ? Math.round((progress.easy_questions_correct / progress.easy_questions_attempted) * 100)
    : 0
    
  const mediumMastery = progress.medium_questions_attempted > 0
    ? Math.round((progress.medium_questions_correct / progress.medium_questions_attempted) * 100) 
    : 0
    
  const hardMastery = progress.hard_questions_attempted > 0
    ? Math.round((progress.hard_questions_correct / progress.hard_questions_attempted) * 100)
    : 0

  const easyMastered = easyMastery >= (CONFIG.EASY_MASTERY_THRESHOLD * 100)
  const mediumMastered = mediumMastery >= (CONFIG.MEDIUM_MASTERY_THRESHOLD * 100)
  const readyForAdvanced = easyMastered && mediumMastered

  return {
    easyMastery,
    mediumMastery, 
    hardMastery,
    easyMastered,
    mediumMastered,
    readyForAdvanced
  }
}

/**
 * Smart Conditional Weighting System
 * 
 * Dynamically adjusts question importance based on foundation mastery:
 * - Weak foundations: Hard performance likely unreliable (reduce weight)
 * - Solid foundations: Hard questions critical for A* (increase weight)
 * - Medium focus: When easy mastered but medium needs work
 */
export function calculateSmartWeightedAccuracy(
  progress: SubtopicProgress, 
  foundation: FoundationMastery
): number {
  // Safety check for no attempts
  if (progress.questions_attempted === 0) return 0

  const easyAcc = progress.easy_questions_attempted > 0 
    ? progress.easy_questions_correct / progress.easy_questions_attempted 
    : 0
  const mediumAcc = progress.medium_questions_attempted > 0
    ? progress.medium_questions_correct / progress.medium_questions_attempted
    : 0  
  const hardAcc = progress.hard_questions_attempted > 0
    ? progress.hard_questions_correct / progress.hard_questions_attempted
    : 0

  // Determine weighting strategy based on foundation status
  let weights: { easy: number, medium: number, hard: number }

  if (foundation.readyForAdvanced) {
    // A* Track: Foundations solid, hard questions get premium weighting
    weights = { easy: 1, medium: 2, hard: 3 }
  } else if (foundation.easyMastered) {
    // Medium Focus: Easy mastered, prioritize medium development
    weights = { easy: 1, medium: 2.5, hard: 1 }
  } else {
    // Foundation Building: Hard performance likely unreliable, don't trust it
    weights = { easy: 2, medium: 1.5, hard: 0.5 }
  }

  // Calculate weighted score
  const weightedScore = (
    (easyAcc * weights.easy * progress.easy_questions_attempted) +
    (mediumAcc * weights.medium * progress.medium_questions_attempted) +
    (hardAcc * weights.hard * progress.hard_questions_attempted)
  )

  const totalWeight = (
    (weights.easy * progress.easy_questions_attempted) +
    (weights.medium * progress.medium_questions_attempted) +
    (weights.hard * progress.hard_questions_attempted)
  )

  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0
}

/**
 * Convert accuracy percentage to mastery level
 */
export function accuracyToLevel(accuracy: number): MasteryLevel {
  const { LEVEL_BOUNDARIES } = CONFIG
  
  let levelNumber: number
  if (accuracy >= LEVEL_BOUNDARIES.MASTERY) levelNumber = 5
  else if (accuracy >= LEVEL_BOUNDARIES.PROFICIENT) levelNumber = 4  
  else if (accuracy >= LEVEL_BOUNDARIES.APPROACHING) levelNumber = 3
  else if (accuracy >= LEVEL_BOUNDARIES.DEVELOPING) levelNumber = 2
  else if (accuracy >= LEVEL_BOUNDARIES.BEGINNING) levelNumber = 1
  else levelNumber = 0

  return {
    level: levelNumber,
    ...LEVEL_DEFINITIONS[levelNumber]
  }
}

/**
 * Assess confidence level based on question volume
 */
export function assessConfidence(questionsUsed: number): PerformanceConfidence {
  if (questionsUsed >= CONFIG.RECENT_QUESTIONS_THRESHOLD) {
    return {
      level: 'high',
      questionsUsed,
      description: 'Highly reliable assessment based on sufficient recent practice',
      needMoreQuestions: false
    }
  } else if (questionsUsed >= CONFIG.MINIMUM_FOR_CONFIDENCE) {
    return {
      level: 'medium', 
      questionsUsed,
      description: 'Moderately reliable - a few more questions would improve accuracy',
      needMoreQuestions: false
    }
  } else if (questionsUsed >= 5) {
    return {
      level: 'low',
      questionsUsed, 
      description: 'Limited data - practice more questions for reliable assessment',
      needMoreQuestions: true
    }
  } else {
    return {
      level: 'insufficient',
      questionsUsed,
      description: 'Insufficient data for reliable current level assessment',
      needMoreQuestions: true
    }
  }
}

/**
 * Generate intelligent recommendations based on comprehensive mastery analysis
 */
export function generateIntelligentRecommendations(
  current: { level: MasteryLevel, confidence: PerformanceConfidence },
  foundation: FoundationMastery,
  examReadiness: { aStarPotential: number, weakestArea: string }
): string[] {
  const recommendations: string[] = []

  // Handle insufficient data first
  if (current.confidence.needMoreQuestions) {
    const needed = CONFIG.MINIMUM_FOR_CONFIDENCE - current.confidence.questionsUsed
    recommendations.push(`Take ${needed}+ more questions to establish reliable current level assessment`)
    return recommendations
  }

  // Foundation-based recommendations (A* exam strategy)
  if (!foundation.easyMastered) {
    recommendations.push("Focus on easy questions first - foundation critical for A* success")
    if (foundation.hardMastery > foundation.easyMastery) {
      recommendations.push("Hard question performance may be unreliable until basics are solid")
    }
  } else if (!foundation.mediumMastered) {
    recommendations.push("Great easy question mastery! Now focus on medium questions")
    recommendations.push("Medium mastery is key to unlocking hard question potential")
  } else if (foundation.readyForAdvanced) {
    recommendations.push("Foundations solid! Hard questions now carry extra weight toward A*")
    recommendations.push(`Focus on ${examReadiness.weakestArea} questions for A* breakthrough`)
  }

  // Level-specific guidance
  if (current.level.level >= 4 && examReadiness.aStarPotential >= 85) {
    recommendations.push("A* potential detected! Focus on consistency across all difficulty levels")
  } else if (current.level.level >= 3) {
    recommendations.push("Good progress! Challenge yourself with harder questions when ready")
  }

  return recommendations
}

/**
 * MAIN FUNCTION: Calculate Comprehensive Mastery Data
 * 
 * This is the primary entry point for the enhanced mastery system.
 * Returns complete multi-dimensional assessment for rich UI display.
 */
export function calculateComprehensiveMastery(progress: SubtopicProgress): ComprehensiveMasteryData {
  // Handle no progress case
  if (!progress || progress.questions_attempted === 0) {
    const unassessedLevel = accuracyToLevel(0)
    return {
      current: {
        level: unassessedLevel,
        accuracy: 0,
        confidence: assessConfidence(0),
        questionsAnalyzed: 0
      },
      overall: {
        level: unassessedLevel, 
        accuracy: 0,
        totalQuestions: 0
      },
      foundation: {
        easyMastery: 0, mediumMastery: 0, hardMastery: 0,
        easyMastered: false, mediumMastered: false, readyForAdvanced: false
      },
      trend: { direction: 'stable', strength: 'slight', description: 'No practice history yet' },
      examReadiness: { aStarPotential: 0, weakestArea: 'easy', nextMilestone: 'Take first assessment' },
      recommendations: ['Start with the assessment to establish your baseline performance.']
    }
  }

  // Foundation analysis (critical for weighting decisions)
  const foundation = assessFoundationMastery(progress)

  // Current level calculation (primary display)
  // Note: For Phase 1, we use all available data as "current" 
  // Phase 2 will implement true "recent questions" analysis
  const currentAccuracy = calculateSmartWeightedAccuracy(progress, foundation)
  const currentLevel = accuracyToLevel(currentAccuracy)
  const confidence = assessConfidence(progress.questions_attempted)

  // Overall level calculation (historical context)
  const overallAccuracy = Math.round((progress.questions_correct / progress.questions_attempted) * 100)
  const overallLevel = accuracyToLevel(overallAccuracy)

  // A* readiness analysis
  const aStarPotential = foundation.readyForAdvanced 
    ? Math.min(currentAccuracy + 10, 100)  // Bonus for solid foundations
    : Math.max(currentAccuracy - 15, 0)     // Penalty for weak foundations

  // Fix TypeScript error with explicit typing
  const weakestArea: 'easy' | 'medium' | 'hard' | 'balanced' = 
    foundation.easyMastery <= foundation.mediumMastery && foundation.easyMastery <= foundation.hardMastery 
      ? 'easy'
      : foundation.mediumMastery <= foundation.hardMastery 
        ? 'medium' 
        : 'hard'

  const nextMilestone = !foundation.easyMastered 
    ? 'Master easy questions (80%+ accuracy)'
    : !foundation.mediumMastered 
    ? 'Master medium questions (70%+ accuracy)' 
    : currentLevel.level < 5 
    ? 'Achieve consistent 90%+ performance for mastery'
    : 'Maintain mastery with periodic review'

  // Trend analysis (simplified for Phase 1)
  const trend = {
    direction: 'stable' as const,
    strength: 'moderate' as const, 
    description: 'Trend analysis coming in Phase 2'
  }

  // Generate intelligent recommendations
  const examReadiness = { aStarPotential, weakestArea, nextMilestone }
  const recommendations = generateIntelligentRecommendations(
    { level: currentLevel, confidence },
    foundation,
    examReadiness
  )

  return {
    current: {
      level: currentLevel,
      accuracy: currentAccuracy,
      confidence,
      questionsAnalyzed: progress.questions_attempted
    },
    overall: {
      level: overallLevel,
      accuracy: overallAccuracy, 
      totalQuestions: progress.questions_attempted
    },
    foundation,
    trend,
    examReadiness,
    recommendations
  }
}

// Export for backward compatibility with existing code
export function calculateMasteryLevel(progress: SubtopicProgress): MasteryLevel {
  const comprehensive = calculateComprehensiveMastery(progress)
  return comprehensive.current.level
}
