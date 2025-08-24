// src/lib/progress-interceptor.ts
import { createClient } from '@/lib/supabase/client'
import { calculateComprehensiveMastery } from '@/lib/enhanced-mastery-calculator'

interface QuizResult {
  questionId: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  difficulty: number
  paperType: string
}

export class ProgressInterceptor {
  /**
   * Intercept QuizInterface progress updates and redirect to IGCSE system
   */
  static async updateIGCSEProgress(
    userId: string,
    subtopicId: string,
    quizResults: QuizResult[]
  ): Promise<void> {
    const supabase = createClient()
    
    try {
      // Calculate new statistics from quiz results
      const totalQuestions = quizResults.length
      const correctAnswers = quizResults.filter(r => r.isCorrect).length
      
      // Break down by difficulty
      const easyResults = quizResults.filter(r => r.difficulty === 1)
      const mediumResults = quizResults.filter(r => r.difficulty === 2)
      const hardResults = quizResults.filter(r => r.difficulty === 3)
      
      const easyCorrect = easyResults.filter(r => r.isCorrect).length
      const mediumCorrect = mediumResults.filter(r => r.isCorrect).length
      const hardCorrect = hardResults.filter(r => r.isCorrect).length
      
      // Break down by paper type
      const coreResults = quizResults.filter(r => r.paperType === 'Core')
      const extendedResults = quizResults.filter(r => r.paperType === 'Extended')
      
      const coreCorrect = coreResults.filter(r => r.isCorrect).length
      const extendedCorrect = extendedResults.filter(r => r.isCorrect).length
      
      // Update user_subtopic_progress
      const { error: updateError } = await supabase
        .from('user_subtopic_progress')
        .upsert({
          user_id: userId,
          subtopic_id: subtopicId,
          questions_attempted: totalQuestions,
          questions_correct: correctAnswers,
          easy_questions_attempted: easyResults.length,
          easy_questions_correct: easyCorrect,
          medium_questions_attempted: mediumResults.length,
          medium_questions_correct: mediumCorrect,
          hard_questions_attempted: hardResults.length,
          hard_questions_correct: hardCorrect,
          core_questions_attempted: coreResults.length,
          core_questions_correct: coreCorrect,
          extended_questions_attempted: extendedResults.length,
          extended_questions_correct: extendedCorrect,
          baseline_assessment_completed: true,
          last_practiced: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subtopic_id'
        })
      
      if (updateError) {
        console.error('Failed to update IGCSE progress:', updateError)
        throw updateError
      }
      
      // Recalculate mastery level
      const { data: updatedProgress } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('subtopic_id', subtopicId)
        .single()
      
      if (updatedProgress) {
        const masteryData = calculateComprehensiveMastery(updatedProgress)
        
        // Update with new mastery level
        await supabase
          .from('user_subtopic_progress')
          .update({
            mastery_percentage: Math.round(masteryData.overall.accuracy),
            current_mastery_level: masteryData.overall.level
          })
          .eq('user_id', userId)
          .eq('subtopic_id', subtopicId)
      }
      
      console.log('✅ IGCSE progress updated successfully')
      
    } catch (error) {
      console.error('❌ Failed to update IGCSE progress:', error)
      throw error
    }
  }
}
// src/lib/progress-interceptor.ts
import { createClient } from '@/lib/supabase/client'
import { calculateComprehensiveMastery } from '@/lib/enhanced-mastery-calculator'

interface QuizResult {
  questionId: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  difficulty: number
  paperType: string
  timeSpent?: number
}

interface QuizCompletionData {
  subtopicId: string
  userId: string
  quizType: 'Assessment' | 'Practice' | 'Mastery'
  paperPath: 'Core' | 'Extended'
  results: QuizResult[]
  totalScore: number
  totalQuestions: number
  accuracy: number
  xpEarned: number
}

export class ProgressInterceptor {
  /**
   * Main progress update function - call this when quiz completes
   */
  static async updateIGCSEProgress(completionData: QuizCompletionData): Promise<boolean> {
    const supabase = createClient()
    
    try {
      console.log('📊 Starting IGCSE progress update...', completionData)
      
      // Calculate new statistics from quiz results
      const stats = this.calculateProgressStats(completionData.results)
      
      // Get current progress to add to existing data
      const { data: currentProgress } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', completionData.userId)
        .eq('subtopic_id', completionData.subtopicId)
        .single()
      
      // Combine with existing progress
      const updatedStats = this.combineWithExisting(stats, currentProgress)
      
      // Update user_subtopic_progress
      const { error: updateError } = await supabase
        .from('user_subtopic_progress')
        .upsert({
          user_id: completionData.userId,
          subtopic_id: completionData.subtopicId,
          questions_attempted: updatedStats.totalAttempted,
          questions_correct: updatedStats.totalCorrect,
          easy_questions_attempted: updatedStats.easyAttempted,
          easy_questions_correct: updatedStats.easyCorrect,
          medium_questions_attempted: updatedStats.mediumAttempted,
          medium_questions_correct: updatedStats.mediumCorrect,
          hard_questions_attempted: updatedStats.hardAttempted,
          hard_questions_correct: updatedStats.hardCorrect,
          core_questions_attempted: updatedStats.coreAttempted,
          core_questions_correct: updatedStats.coreCorrect,
          extended_questions_attempted: updatedStats.extendedAttempted,
          extended_questions_correct: updatedStats.extendedCorrect,
          baseline_assessment_completed: completionData.quizType === 'Assessment' ? true : (currentProgress?.baseline_assessment_completed || false),
          last_practiced: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subtopic_id'
        })
      
      if (updateError) {
        console.error('❌ Failed to update IGCSE progress:', updateError)
        return false
      }
      
      // Recalculate mastery level
      const { data: newProgress } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', completionData.userId)
        .eq('subtopic_id', completionData.subtopicId)
        .single()
      
      if (newProgress) {
        const masteryData = calculateComprehensiveMastery(newProgress)
        
        // Update with new mastery calculation
        await supabase
          .from('user_subtopic_progress')
          .update({
            mastery_percentage: Math.round(masteryData.overall.accuracy),
            current_mastery_level: masteryData.overall.level
          })
          .eq('user_id', completionData.userId)
          .eq('subtopic_id', completionData.subtopicId)
        
        console.log('✅ IGCSE progress updated successfully:', {
          subtopic: completionData.subtopicId,
          newLevel: masteryData.overall.level,
          accuracy: Math.round(masteryData.overall.accuracy)
        })
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Progress update failed:', error)
      return false
    }
  }
  
  /**
   * Calculate statistics from quiz results
   */
  private static calculateProgressStats(results: QuizResult[]) {
    const stats = {
      totalAttempted: results.length,
      totalCorrect: results.filter(r => r.isCorrect).length,
      easyAttempted: results.filter(r => r.difficulty === 1).length,
      easyCorrect: results.filter(r => r.difficulty === 1 && r.isCorrect).length,
      mediumAttempted: results.filter(r => r.difficulty === 2).length,
      mediumCorrect: results.filter(r => r.difficulty === 2 && r.isCorrect).length,
      hardAttempted: results.filter(r => r.difficulty === 3).length,
      hardCorrect: results.filter(r => r.difficulty === 3 && r.isCorrect).length,
      coreAttempted: results.filter(r => r.paperType === 'Core').length,
      coreCorrect: results.filter(r => r.paperType === 'Core' && r.isCorrect).length,
      extendedAttempted: results.filter(r => r.paperType === 'Extended').length,
      extendedCorrect: results.filter(r => r.paperType === 'Extended' && r.isCorrect).length
    }
    
    return stats
  }
  
  /**
   * Combine new quiz stats with existing progress
   */
  private static combineWithExisting(newStats: any, existing: any) {
    if (!existing) return newStats
    
    return {
      totalAttempted: (existing.questions_attempted || 0) + newStats.totalAttempted,
      totalCorrect: (existing.questions_correct || 0) + newStats.totalCorrect,
      easyAttempted: (existing.easy_questions_attempted || 0) + newStats.easyAttempted,
      easyCorrect: (existing.easy_questions_correct || 0) + newStats.easyCorrect,
      mediumAttempted: (existing.medium_questions_attempted || 0) + newStats.mediumAttempted,
      mediumCorrect: (existing.medium_questions_correct || 0) + newStats.mediumCorrect,
      hardAttempted: (existing.hard_questions_attempted || 0) + newStats.hardAttempted,
      hardCorrect: (existing.hard_questions_correct || 0) + newStats.hardCorrect,
      coreAttempted: (existing.core_questions_attempted || 0) + newStats.coreAttempted,
      coreCorrect: (existing.core_questions_correct || 0) + newStats.coreCorrect,
      extendedAttempted: (existing.extended_questions_attempted || 0) + newStats.extendedAttempted,
      extendedCorrect: (existing.extended_questions_correct || 0) + newStats.extendedCorrect
    }
  }
  
  /**
   * Create completion data from quiz results - helper function
   */
  static createCompletionData(
    subtopicId: string,
    userId: string,
    quizType: 'Assessment' | 'Practice' | 'Mastery',
    paperPath: 'Core' | 'Extended',
    quizResults: any[],
    originalQuestions: any[]
  ): QuizCompletionData {
    const results: QuizResult[] = quizResults.map((result, index) => ({
      questionId: originalQuestions[index]?.id || `unknown-${index}`,
      userAnswer: result.selectedAnswer || result.answer || '',
      correctAnswer: originalQuestions[index]?.correct_answer || '',
      isCorrect: result.isCorrect || false,
      difficulty: originalQuestions[index]?.difficulty || 1,
      paperType: originalQuestions[index]?.paper_type || 'Core',
      timeSpent: result.timeSpent || 0
    }))
    
    const totalScore = results.filter(r => r.isCorrect).length
    const accuracy = results.length > 0 ? (totalScore / results.length) * 100 : 0
    
    return {
      subtopicId,
      userId,
      quizType,
      paperPath,
      results,
      totalScore,
      totalQuestions: results.length,
      accuracy,
      xpEarned: 0 // Will be calculated by QuizInterface
    }
  }
}

export type { QuizCompletionData, QuizResult }
