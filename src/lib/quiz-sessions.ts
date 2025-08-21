import { createClient } from '@/lib/supabase/client'
import { QuizSession, QuizAttempt, Question } from '@/lib/types'

export class QuizSessionManager {
  private supabase = createClient()

  /**
   * Ensure we have a valid session before making requests
   */
  private async ensureValidSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        console.error('Session check failed:', error.message)
        return false
      }

      if (!session) {
        console.error('No active session found')
        return false
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const tokenExpiresAt = session.expires_at
      const currentTime = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = tokenExpiresAt! - currentTime

      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('Token expiring soon, refreshing...')
        const { error: refreshError } = await this.supabase.auth.refreshSession()
        if (refreshError) {
          console.error('Token refresh failed:', refreshError.message)
          return false
        }
        console.log('? Token refreshed successfully')
      }

      return true
    } catch (error) {
      console.error('Session validation failed:', error)
      return false
    }
  }

  /**
   * Create a new quiz session
   */
  async createSession(
    userId: string,
    subjectId: string,
    sessionType: 'practice' | 'timed' | 'review' = 'practice'
  ): Promise<QuizSession | null> {
    try {
      // Ensure we have a valid session before attempting to create quiz session
      const hasValidSession = await this.ensureValidSession()
      if (!hasValidSession) {
        console.error('Cannot create quiz session: Invalid or expired authentication')
        return null
      }

      const { data, error } = await this.supabase
        .from('quiz_sessions')
        .insert({
          user_id: userId,
          subject_id: subjectId,
          session_type: sessionType,
          started_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error creating quiz session:', error.message)

        // If it's an auth error, suggest re-login
        if (error.message.includes('JWT') || error.message.includes('expired') || error.message.includes('policy')) {
          console.error('?? Authentication issue detected. Please sign out and sign back in.')
        }

        return null
      }

      return data
    } catch (error) {
      console.error('Failed to create quiz session:', error)
      return null
    }
  }

  /**
   * Complete a quiz session with final stats
   */
  async completeSession(
    sessionId: string,
    totalQuestions: number,
    correctAnswers: number,
    totalXP: number
  ): Promise<boolean> {
    try {
      const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

      const { error } = await this.supabase
        .from('quiz_sessions')
        .update({
          completed_at: new Date().toISOString(),
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          total_xp_earned: totalXP,
          accuracy_percentage: accuracy
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error completing quiz session:', error.message)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to complete quiz session:', error)
      return false
    }
  }

  /**
   * Record a quiz attempt with session tracking
   */
  async recordAttempt(
    userId: string,
    sessionId: string,
    questionId: string,
    userAnswer: string,
    isCorrect: boolean,
    timeTaken: number,
    xpEarned: number,
    difficultyLevel: number,
    questionOrder: number
  ): Promise<boolean> {
    try {
      // Ensure valid session before recording attempt
      const hasValidSession = await this.ensureValidSession()
      if (!hasValidSession) {
        console.error('Cannot record quiz attempt: Invalid or expired authentication')
        return false
      }

      const { error } = await this.supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          quiz_session_id: sessionId,
          question_id: questionId,
          question_order: questionOrder,
          user_answer: userAnswer,
          is_correct: isCorrect,
          time_taken: timeTaken,
          xp_earned: xpEarned,
          difficulty_at_time: difficultyLevel
        })

      if (error) {
        console.error('Error recording quiz attempt:', error.message)

        // If it's an auth error, suggest re-login
        if (error.message.includes('JWT') || error.message.includes('expired') || error.message.includes('policy')) {
          console.error('?? Authentication issue detected. Please sign out and sign back in.')
        }

        return false
      }

      return true
    } catch (error) {
      console.error('Failed to record quiz attempt:', error)
      return false
    }
  }

  /**
   * Get user's quiz history
   */
  async getUserQuizHistory(userId: string, limit: number = 50): Promise<QuizSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching quiz history:', error.message)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch quiz history:', error)
      return []
    }
  }

  /**
   * Get detailed session review with all questions and attempts
   */
  async getSessionReview(sessionId: string): Promise<{
    session: QuizSession | null,
    attempts: (QuizAttempt & { questions: Question })[]
  }> {
    try {
      // Get session details
      const { data: sessionData, error: sessionError } = await this.supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Error fetching session:', sessionError.message)
        return { session: null, attempts: [] }
      }

      // Get all attempts for this session
      const { data: attemptsData, error: attemptsError } = await this.supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_session_id', sessionId)
        .order('question_order', { ascending: true })

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError.message)
        return { session: sessionData, attempts: [] }
      }

      return {
        session: sessionData,
        attempts: attemptsData || []
      }
    } catch (error) {
      console.error('Failed to get session review:', error)
      return { session: null, attempts: [] }
    }
  }

  /**
   * Get quiz statistics for a user
   */
  async getUserQuizStats(userId: string): Promise<{
    totalQuizzes: number
    totalQuestions: number
    totalCorrect: number
    averageAccuracy: number
    totalXP: number
    recentStreakDays: number
  }> {
    try {
      const { data, error } = await this.supabase
        .from('quiz_sessions')
        .select('total_questions, correct_answers, total_xp_earned, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)

      if (error) {
        console.error('Error fetching quiz stats:', error.message)
        return {
          totalQuizzes: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          averageAccuracy: 0,
          totalXP: 0,
          recentStreakDays: 0
        }
      }

      const sessions = data || []

      const totalQuizzes = sessions.length
      const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions || 0), 0)
      const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0)
      const totalXP = sessions.reduce((sum, s) => sum + (s.total_xp_earned || 0), 0)
      const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

      // Calculate recent streak (simplified - consecutive days with at least one quiz)
      const recentDates = sessions
        .map(s => s.completed_at ? new Date(s.completed_at).toDateString() : null)
        .filter(Boolean)
        .filter((date, index, arr) => arr.indexOf(date) === index) // unique dates
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime()) // newest first

      let streakDays = 0
      let currentDate = new Date()

      for (const dateStr of recentDates) {
        const sessionDate = new Date(dateStr!)
        const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays <= streakDays + 1) {
          streakDays++
          currentDate = sessionDate
        } else {
          break
        }
      }

      return {
        totalQuizzes,
        totalQuestions,
        totalCorrect,
        averageAccuracy,
        totalXP,
        recentStreakDays: streakDays
      }
    } catch (error) {
      console.error('Failed to get quiz stats:', error)
      return {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        averageAccuracy: 0,
        totalXP: 0,
        recentStreakDays: 0
      }
    }
  }
}

