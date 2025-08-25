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
  timeSpent?: number
}

export class ProgressInterceptor {
  static async updateIGCSEProgress(completionData: QuizCompletionData): Promise<boolean> {
    const supabase = createClient()
    
    try {
      console.log('📊 Starting IGCSE progress update...', completionData)
      
      const stats = this.calculateProgressStats(completionData.results)
      
      const { data: currentProgress } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', completionData.userId)
        .eq('subtopic_id', completionData.subtopicId)
        .single()
      
      const updatedStats = this.combineWithExisting(stats, currentProgress)
      
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
      
      const { data: newProgress } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', completionData.userId)
        .eq('subtopic_id', completionData.subtopicId)
        .single()
      
      if (newProgress) {
        const masteryData = calculateComprehensiveMastery(newProgress)
        
        await supabase
          .from('user_subtopic_progress')
          .update({
            mastery_percentage: Math.round(masteryData.overall.accuracy),
            current_mastery_level: masteryData.overall.level.label
          })
          .eq('user_id', completionData.userId)
          .eq('subtopic_id', completionData.subtopicId)
        
        console.log('✅ IGCSE progress updated successfully:', {
          subtopic: completionData.subtopicId,
          newLevel: masteryData.overall.level.label,
          accuracy: Math.round(masteryData.overall.accuracy)
        })
      }

      // Navigate to results page with quiz data
      this.redirectToResults(completionData)
      
      return true
      
    } catch (error) {
      console.error('❌ Progress update failed:', error)
      return false
    }
  }

  private static redirectToResults(completionData: QuizCompletionData) {
    const resultsUrl = new URL(`/quiz/results/${completionData.subtopicId}`, window.location.origin)
    
    // Pass quiz results as URL parameters
    resultsUrl.searchParams.set('quizType', completionData.quizType)
    resultsUrl.searchParams.set('paperPath', completionData.paperPath)
    resultsUrl.searchParams.set('score', completionData.totalScore.toString())
    resultsUrl.searchParams.set('total', completionData.totalQuestions.toString())
    resultsUrl.searchParams.set('xpEarned', completionData.xpEarned.toString())
    resultsUrl.searchParams.set('timeSpent', (completionData.timeSpent || 0).toString())
    
    // Add focus parameter if it's a practice quiz
    if (completionData.quizType === 'Practice') {
      const focusMap = {
        1: 'Easy',
        2: 'Medium', 
        3: 'Hard'
      }
      const difficulties = completionData.results.map(r => r.difficulty)
      const primaryDifficulty = difficulties.sort((a, b) => 
        difficulties.filter(d => d === b).length - difficulties.filter(d => d === a).length
      )[0]
      
      if (primaryDifficulty && focusMap[primaryDifficulty as keyof typeof focusMap]) {
        resultsUrl.searchParams.set('focus', focusMap[primaryDifficulty as keyof typeof focusMap])
      }
    }
    
    // Navigate to results page
    window.location.href = resultsUrl.toString()
  }
  
  private static calculateProgressStats(results: QuizResult[]) {
    return {
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
  }
  
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
      xpEarned: totalScore * 10, // Simple XP calculation
      timeSpent: results.reduce((total, r) => total + (r.timeSpent || 0), 0)
    }
  }
}

export type { QuizCompletionData, QuizResult }
