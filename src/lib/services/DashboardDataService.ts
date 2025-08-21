import { createClient } from '@/lib/supabase/client'

export class DashboardDataService {
  private supabase = createClient()

  async getUserProgress(userId: string) {
    // Get quiz sessions and attempts
    const [sessions, attempts] = await Promise.all([
      this.supabase.from('quiz_sessions').select('*').eq('user_id', userId),
      this.supabase.from('quiz_attempts').select('*').eq('user_id', userId)
    ])

    // Calculate consistent metrics
    const uniqueQuestions = [...new Set(attempts.data?.map(a => a.question_id) || [])]
    const totalCorrect = attempts.data?.filter(a => a.is_correct).length || 0
    const totalXP = sessions.data?.reduce((sum, s) => sum + (s.total_xp_earned || 0), 0) || 0
    const accuracy = attempts.data?.length ? Math.round((totalCorrect / attempts.data.length) * 100) : 0

    return {
      questionsAnswered: uniqueQuestions.length,     // Unique questions attempted
      questionAttempts: attempts.data?.length || 0,  // Total attempts including retakes
      quizzesCompleted: sessions.data?.length || 0,  // Quiz sessions finished  
      answerAccuracy: accuracy,                      // Percentage correct
      xpEarned: totalXP                             // Total experience points
    }
  }
}
