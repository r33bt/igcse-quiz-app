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
