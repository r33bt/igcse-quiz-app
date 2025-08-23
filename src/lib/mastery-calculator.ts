// =====================================================
// MASTERY CALCULATION SYSTEM
// =====================================================

export type MasteryLevel = 'Unassessed' | 'Developing' | 'Approaching' | 'Proficient' | 'Mastery'
export type RecommendedAction = 'Take Assessment' | 'Focus Practice' | 'Practice Hard Questions' | 'Attempt Mastery' | 'Review & Maintain'

export interface UserProgress {
  subtopic_id: string
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
  baseline_score: number
  current_mastery_level: MasteryLevel
  mastery_percentage: number
}

export interface MasteryCalculation {
  masteryLevel: MasteryLevel
  masteryPercentage: number
  recommendedAction: RecommendedAction
  strengths: string[]
  weaknesses: string[]
  nextSteps: string[]
}

export class MasteryCalculator {
  
  /**
   * Calculate comprehensive mastery level for a subtopic
   */
  static calculateSubtopicMastery(progress: UserProgress, userPath: 'Core' | 'Extended' = 'Core'): MasteryCalculation {
    
    // If no assessment taken, return unassessed
    if (!progress.baseline_assessment_completed || progress.core_questions_attempted === 0) {
      return {
        masteryLevel: 'Unassessed',
        masteryPercentage: 0,
        recommendedAction: 'Take Assessment',
        strengths: [],
        weaknesses: ['No baseline assessment completed'],
        nextSteps: ['Complete the 10-question baseline assessment to establish your starting point']
      }
    }

    // Calculate accuracy percentages
    const coreAccuracy = progress.core_questions_attempted > 0 
      ? (progress.core_questions_correct / progress.core_questions_attempted) * 100 
      : 0

    const extendedAccuracy = progress.extended_questions_attempted > 0 
      ? (progress.extended_questions_correct / progress.extended_questions_attempted) * 100 
      : 0

    const easyAccuracy = progress.easy_questions_attempted > 0 
      ? (progress.easy_questions_correct / progress.easy_questions_attempted) * 100 
      : 0

    const mediumAccuracy = progress.medium_questions_attempted > 0 
      ? (progress.medium_questions_correct / progress.medium_questions_attempted) * 100 
      : 0

    const hardAccuracy = progress.hard_questions_attempted > 0 
      ? (progress.hard_questions_correct / progress.hard_questions_attempted) * 100 
      : 0

    // Calculate weighted overall accuracy
    let weightedAccuracy = 0
    let totalWeight = 0

    if (userPath === 'Core') {
      // Core path: Focus on core questions
      weightedAccuracy += coreAccuracy * 0.8 // 80% weight on core
      weightedAccuracy += extendedAccuracy * 0.2 // 20% weight on extended (if any)
      totalWeight = 1.0
    } else {
      // Extended path: Balance core and extended
      weightedAccuracy += coreAccuracy * 0.6 // 60% weight on core
      weightedAccuracy += extendedAccuracy * 0.4 // 40% weight on extended
      totalWeight = 1.0
    }

    // Apply difficulty weighting
    const difficultyScore = (easyAccuracy * 0.3 + mediumAccuracy * 0.4 + hardAccuracy * 0.3)
    const finalMasteryPercentage = Math.round((weightedAccuracy + difficultyScore) / 2)

    // Determine mastery level
    let masteryLevel: MasteryLevel
    let recommendedAction: RecommendedAction

    if (finalMasteryPercentage >= 90) {
      masteryLevel = 'Mastery'
      recommendedAction = 'Review & Maintain'
    } else if (finalMasteryPercentage >= 75) {
      masteryLevel = 'Proficient'
      recommendedAction = 'Attempt Mastery'
    } else if (finalMasteryPercentage >= 60) {
      masteryLevel = 'Approaching'
      recommendedAction = 'Practice Hard Questions'
    } else if (finalMasteryPercentage >= 1) {
      masteryLevel = 'Developing'
      recommendedAction = 'Focus Practice'
    } else {
      masteryLevel = 'Unassessed'
      recommendedAction = 'Take Assessment'
    }

    // Identify strengths and weaknesses
    const strengths: string[] = []
    const weaknesses: string[] = []

    if (easyAccuracy >= 80) strengths.push('Strong foundation (Easy questions)')
    else if (easyAccuracy < 60) weaknesses.push('Basic concepts need review')

    if (mediumAccuracy >= 75) strengths.push('Good application skills (Medium questions)')
    else if (mediumAccuracy < 60) weaknesses.push('Application skills need work')

    if (hardAccuracy >= 70) strengths.push('Excellent problem-solving (Hard questions)')
    else if (hardAccuracy < 50) weaknesses.push('Complex problem-solving needs practice')

    if (userPath === 'Extended') {
      if (extendedAccuracy >= 70) strengths.push('Strong extended content mastery')
      else if (extendedAccuracy < 50) weaknesses.push('Extended content needs focus')
    }

    // Generate next steps
    const nextSteps: string[] = []
    
    if (masteryLevel === 'Developing') {
      nextSteps.push('Focus on fundamental concepts with easy questions')
      nextSteps.push('Take targeted practice quizzes in weak areas')
    } else if (masteryLevel === 'Approaching') {
      nextSteps.push('Practice medium and hard difficulty questions')
      nextSteps.push('Review specific problem-solving techniques')
    } else if (masteryLevel === 'Proficient') {
      nextSteps.push('Take the mastery validation quiz (20 questions)')
      nextSteps.push('Challenge yourself with harder questions')
    } else if (masteryLevel === 'Mastery') {
      nextSteps.push('Maintain knowledge with periodic review')
      nextSteps.push('Help others or move to advanced topics')
    }

    return {
      masteryLevel,
      masteryPercentage: finalMasteryPercentage,
      recommendedAction,
      strengths,
      weaknesses,
      nextSteps
    }
  }

  /**
   * Calculate overall topic mastery from subtopic progress
   */
  static calculateTopicMastery(subtopicProgresses: UserProgress[]): {
    overallMastery: number
    masteredCount: number
    totalCount: number
    averageLevel: MasteryLevel
  } {
    if (subtopicProgresses.length === 0) {
      return {
        overallMastery: 0,
        masteredCount: 0,
        totalCount: 0,
        averageLevel: 'Unassessed'
      }
    }

    const masteredCount = subtopicProgresses.filter(p => 
      p.current_mastery_level === 'Proficient' || p.current_mastery_level === 'Mastery'
    ).length

    const totalMastery = subtopicProgresses.reduce((sum, p) => sum + p.mastery_percentage, 0)
    const overallMastery = Math.round(totalMastery / subtopicProgresses.length)

    let averageLevel: MasteryLevel = 'Unassessed'
    if (overallMastery >= 90) averageLevel = 'Mastery'
    else if (overallMastery >= 75) averageLevel = 'Proficient'
    else if (overallMastery >= 60) averageLevel = 'Approaching'
    else if (overallMastery >= 1) averageLevel = 'Developing'

    return {
      overallMastery,
      masteredCount,
      totalCount: subtopicProgresses.length,
      averageLevel
    }
  }
}
