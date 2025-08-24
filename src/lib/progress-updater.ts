// src/lib/progress-updater.ts
import { createClient } from '@/lib/supabase/client'
import { calculateComprehensiveMastery } from '@/lib/enhanced-mastery-calculator'

// Add this interface after the imports in progress-updater.ts
interface UserSubtopicProgress {
  user_id: string
  subtopic_id: string
  questions_attempted: number
  questions_correct: number
  easy_questions_attempted: number
  easy_questions_correct: number
  medium_questions_attempted: number
  medium_questions_correct: number
  hard_questions_attempted: number
  hard_questions_correct: number
  core_questions_attempted: number
  core_questions_correct: number
  extended_questions_attempted: number
  extended_questions_correct: number
  baseline_assessment_completed: boolean
  mastery_percentage?: number
  current_mastery_level?: string
  created_at: string
  updated_at?: string
}

interface QuizResults {
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  questionResults: Array<{
    questionId: string
    correct: boolean
    difficulty: number
    questionCategory: string
    timeSpent: number
  }>
}

export class ProgressUpdater {
  /**
   * Update user progress after quiz completion
   */
  static async updateFromQuizResults(
    userId: string,
    subtopicId: string,
    paperPath: 'Core' | 'Extended',
    results: QuizResults
  ): Promise<void> {
    const supabase = createClient()
    
    try {
      // Get current progress
      const { data: currentProgress } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('subtopic_id', subtopicId)
        .single()

      // Calculate new progress based on results
      const newProgress = this.calculateProgressUpdate(
        currentProgress,
        results,
        paperPath
      )

      // Upsert progress record
      const { error } = await supabase
        .from('user_subtopic_progress')
        .upsert(newProgress, {
          onConflict: 'user_id,subtopic_id'
        })

      if (error) {
        console.error('Failed to update progress:', error)
        throw error
      }

      // Record quiz session for history
      await this.recordQuizSession(userId, subtopicId, paperPath, results)
      
    } catch (error) {
      console.error('Error updating progress:', error)
      throw error
    }
  }

  /**
   * Calculate updated progress metrics
   */
  private static calculateProgressUpdate(
    currentProgress: UserSubtopicProgress | null,
    results: QuizResults,
    paperPath: 'Core' | 'Extended'
  ) {
    const now = new Date().toISOString()
    
    // Initialize if no current progress
    if (!currentProgress) {
      currentProgress = {
        user_id: '',
        subtopic_id: '',
        questions_attempted: 0,
        questions_correct: 0,
        easy_questions_attempted: 0,
        easy_questions_correct: 0,
        medium_questions_attempted: 0,
        medium_questions_correct: 0,
        hard_questions_attempted: 0,
        hard_questions_correct: 0,
        core_questions_attempted: 0,
        core_questions_correct: 0,
        extended_questions_attempted: 0,
        extended_questions_correct: 0,
        baseline_assessment_completed: false,
        created_at: now
      }
    }

    // Count results by difficulty and type
    const difficultyCounts = this.countResultsByDifficulty(results)
    const paperCounts = this.countResultsByPaperType(results, paperPath)

    // Update totals
    const updatedProgress = {
      ...currentProgress,
      questions_attempted: currentProgress.questions_attempted + results.totalQuestions,
      questions_correct: currentProgress.questions_correct + results.correctAnswers,
      
      // Update difficulty breakdowns
      easy_questions_attempted: currentProgress.easy_questions_attempted + difficultyCounts.easy.attempted,
      easy_questions_correct: currentProgress.easy_questions_correct + difficultyCounts.easy.correct,
      medium_questions_attempted: currentProgress.medium_questions_attempted + difficultyCounts.medium.attempted,
      medium_questions_correct: currentProgress.medium_questions_correct + difficultyCounts.medium.correct,
      hard_questions_attempted: currentProgress.hard_questions_attempted + difficultyCounts.hard.attempted,
      hard_questions_correct: currentProgress.hard_questions_correct + difficultyCounts.hard.correct,
      
      // Update paper type breakdowns
      core_questions_attempted: currentProgress.core_questions_attempted + paperCounts.core.attempted,
      core_questions_correct: currentProgress.core_questions_correct + paperCounts.core.correct,
      extended_questions_attempted: currentProgress.extended_questions_attempted + paperCounts.extended.attempted,
      extended_questions_correct: currentProgress.extended_questions_correct + paperCounts.extended.correct,
      
      // Update metadata
      last_practiced: now,
      updated_at: now
    }

    // Calculate new mastery level
    const masteryData = calculateComprehensiveMastery(updatedProgress)
    updatedProgress.mastery_percentage = Math.round(masteryData.current.accuracy * 100)
    updatedProgress.current_mastery_level = masteryData.current.level.name

    return updatedProgress
  }

  /**
   * Count results by difficulty level
   */
  private static countResultsByDifficulty(results: QuizResults) {
    const counts = {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 }
    }

    results.questionResults.forEach(result => {
      const difficulty = result.difficulty === 1 ? 'easy' : 
                        result.difficulty === 2 ? 'medium' : 'hard'
      
      counts[difficulty].attempted++
      if (result.correct) {
        counts[difficulty].correct++
      }
    })

    return counts
  }

  /**
   * Count results by paper type
   */
  private static countResultsByPaperType(
  results: QuizResults, 
  _paperPath: 'Core' | 'Extended'  // Prefix with _ to indicate intentionally unused
) {
    const counts = {
      core: { attempted: 0, correct: 0 },
      extended: { attempted: 0, correct: 0 }
    }

    results.questionResults.forEach(result => {
      const paperType = result.questionCategory?.toLowerCase().includes('extended') ? 'extended' : 'core'
      
      counts[paperType].attempted++
      if (result.correct) {
        counts[paperType].correct++
      }
    })

    return counts
  }

  /**
   * Record quiz session for history tracking
   */
  private static async recordQuizSession(
    userId: string,
    subtopicId: string,
    paperPath: 'Core' | 'Extended',
    results: QuizResults
  ) {
    const supabase = createClient()
    
    await supabase.from('quiz_sessions').insert({
      user_id: userId,
      subtopic_id: subtopicId,
      paper_path: paperPath,
      questions_total: results.totalQuestions,
      questions_correct: results.correctAnswers,
      time_spent_seconds: results.timeSpent,
      completed_at: new Date().toISOString()
    })
  }
}

export type { QuizResults }