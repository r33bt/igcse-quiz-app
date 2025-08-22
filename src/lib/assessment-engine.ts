// =====================================================
// ASSESSMENT ENGINE - SMART QUIZ GENERATION
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface QuestionOptions {
  [key: string]: string
}

export interface Question {
  id: string
  question_text: string
  options: QuestionOptions | null
  correct_answer: string
  explanation?: string
  difficulty: number
  difficulty_label: 'Easy' | 'Medium' | 'Hard'
  question_category: 'Core' | 'Extended'
  estimated_time_seconds: number
  subtopic_code?: string
  subtopic_title?: string
}

export interface QuizConfig {
  subtopicId: string
  quizType: 'Baseline' | 'Practice' | 'Mastery' | 'Review'
  userPath: 'Core' | 'Extended'
  questionCount: number
  difficultyMix?: {
    easy: number
    medium: number
    hard: number
  }
  focusAreas?: string[] // Specific difficulty levels to focus on
}

export interface GeneratedQuiz {
  id: string
  config: QuizConfig
  questions: Question[]
  estimatedTimeMinutes: number
  metadata: {
    coreQuestions: number
    extendedQuestions: number
    easyQuestions: number
    mediumQuestions: number
    hardQuestions: number
  }
}

interface QuestionData {
  id: string
  question_text: string
  options: QuestionOptions | null
  correct_answer: string
  explanation?: string
  difficulty: number
  difficulty_label: 'Easy' | 'Medium' | 'Hard'
  question_category: 'Core' | 'Extended'
  estimated_time_seconds: number
  subtopic_code?: string
  subtopic_title?: string
  times_asked?: number
}

export class AssessmentEngine {
  
  /**
   * Generate a baseline assessment quiz for a subtopic
   * 10 questions: 60% core, 40% extended (if Extended path)
   * Difficulty: 40% easy, 40% medium, 20% hard
   */
  static async generateBaselineQuiz(
    subtopicId: string, 
    userPath: 'Core' | 'Extended' = 'Core'
  ): Promise<GeneratedQuiz> {
    
    const config: QuizConfig = {
      subtopicId,
      quizType: 'Baseline',
      userPath,
      questionCount: 10,
      difficultyMix: { easy: 4, medium: 4, hard: 2 }
    }

    return this.generateQuiz(config)
  }

  /**
   * Generate a practice quiz focusing on weak areas
   */
  static async generatePracticeQuiz(
    subtopicId: string,
    userPath: 'Core' | 'Extended' = 'Core',
    focusAreas: string[] = ['Medium', 'Hard']
  ): Promise<GeneratedQuiz> {
    
    const config: QuizConfig = {
      subtopicId,
      quizType: 'Practice',
      userPath,
      questionCount: 8,
      focusAreas
    }

    return this.generateQuiz(config)
  }

  /**
   * Generate a mastery validation quiz
   * 15 questions with higher difficulty emphasis
   */
  static async generateMasteryQuiz(
    subtopicId: string,
    userPath: 'Core' | 'Extended' = 'Core'
  ): Promise<GeneratedQuiz> {
    
    const config: QuizConfig = {
      subtopicId,
      quizType: 'Mastery',
      userPath,
      questionCount: 15,
      difficultyMix: { easy: 3, medium: 6, hard: 6 }
    }

    return this.generateQuiz(config)
  }

  /**
   * Core quiz generation logic
   */
  private static async generateQuiz(config: QuizConfig): Promise<GeneratedQuiz> {
    const questions: Question[] = []
    let metadata = {
      coreQuestions: 0,
      extendedQuestions: 0,
      easyQuestions: 0,
      mediumQuestions: 0,
      hardQuestions: 0
    }

    try {
      // Build query for question selection
      let query = supabase
        .from('question_selection_helper')
        .select('*')
        .eq('igcse_subtopic_id', config.subtopicId)

      // Apply category filter based on user path
      if (config.userPath === 'Core') {
        query = query.eq('question_category', 'Core')
      }

      // Apply baseline/mastery filters
      if (config.quizType === 'Baseline') {
        query = query.eq('is_baseline_question', true)
      } else if (config.quizType === 'Mastery') {
        query = query.eq('mastery_validation', true)
      }

      const { data: availableQuestions, error } = await query

      if (error) {
        console.error('Error fetching questions:', error)
        throw error
      }

      if (!availableQuestions || availableQuestions.length === 0) {
        throw new Error(`No questions available for subtopic ${config.subtopicId}`)
      }

      // Organize questions by difficulty
      const questionsByDifficulty = {
        easy: availableQuestions.filter(q => q.difficulty === 1),
        medium: availableQuestions.filter(q => q.difficulty === 2),
        hard: availableQuestions.filter(q => q.difficulty >= 3)
      }

      // Select questions based on difficulty mix or focus areas
      if (config.difficultyMix && config.quizType !== 'Practice') {
        // Structured selection for baseline/mastery
        questions.push(...this.selectQuestionsByDifficulty(questionsByDifficulty.easy, config.difficultyMix.easy))
        questions.push(...this.selectQuestionsByDifficulty(questionsByDifficulty.medium, config.difficultyMix.medium))
        questions.push(...this.selectQuestionsByDifficulty(questionsByDifficulty.hard, config.difficultyMix.hard))
      } else if (config.focusAreas) {
        // Focused selection for practice
        const focusQuestions: QuestionData[] = []
        config.focusAreas.forEach(area => {
          if (area === 'Easy') focusQuestions.push(...questionsByDifficulty.easy)
          if (area === 'Medium') focusQuestions.push(...questionsByDifficulty.medium)
          if (area === 'Hard') focusQuestions.push(...questionsByDifficulty.hard)
        })
        questions.push(...this.selectQuestionsByDifficulty(focusQuestions, config.questionCount))
      } else {
        // Random selection
        questions.push(...this.selectQuestionsByDifficulty(availableQuestions, config.questionCount))
      }

      // Calculate metadata
      metadata = {
        coreQuestions: questions.filter(q => q.question_category === 'Core').length,
        extendedQuestions: questions.filter(q => q.question_category === 'Extended').length,
        easyQuestions: questions.filter(q => q.difficulty === 1).length,
        mediumQuestions: questions.filter(q => q.difficulty === 2).length,
        hardQuestions: questions.filter(q => q.difficulty >= 3).length
      }

      const estimatedTimeMinutes = Math.ceil(
        questions.reduce((sum, q) => sum + q.estimated_time_seconds, 0) / 60
      )

      return {
        id: `quiz_${Date.now()}_${config.subtopicId.slice(0, 8)}`,
        config,
        questions: this.shuffleArray(questions), // Randomize question order
        estimatedTimeMinutes,
        metadata
      }

    } catch (error) {
      console.error('Error generating quiz:', error)
      throw error
    }
  }

  /**
   * Select specified number of questions from array, prioritizing less-used questions
   */
  private static selectQuestionsByDifficulty(questions: QuestionData[], count: number): Question[] {
    if (questions.length === 0) return []
    
    // Sort by usage (times_asked) to prefer less-used questions
    const sortedQuestions = [...questions].sort((a, b) => 
      (a.times_asked || 0) - (b.times_asked || 0)
    )
    
    return sortedQuestions.slice(0, Math.min(count, sortedQuestions.length))
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Get available question counts for a subtopic
   */
  static async getQuestionAvailability(subtopicId: string): Promise<{
    total: number
    byDifficulty: { easy: number, medium: number, hard: number }
    byCategory: { core: number, extended: number }
    baselineReady: number
    masteryReady: number
  }> {
    try {
      const { data: questions, error } = await supabase
        .from('question_selection_helper')
        .select('difficulty, question_category, is_baseline_question, mastery_validation')
        .eq('igcse_subtopic_id', subtopicId)

      if (error) throw error

      return {
        total: questions?.length || 0,
        byDifficulty: {
          easy: questions?.filter(q => q.difficulty === 1).length || 0,
          medium: questions?.filter(q => q.difficulty === 2).length || 0,
          hard: questions?.filter(q => q.difficulty >= 3).length || 0
        },
        byCategory: {
          core: questions?.filter(q => q.question_category === 'Core').length || 0,
          extended: questions?.filter(q => q.question_category === 'Extended').length || 0
        },
        baselineReady: questions?.filter(q => q.is_baseline_question).length || 0,
        masteryReady: questions?.filter(q => q.mastery_validation).length || 0
      }
    } catch (error) {
      console.error('Error checking question availability:', error)
      return {
        total: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        byCategory: { core: 0, extended: 0 },
        baselineReady: 0,
        masteryReady: 0
      }
    }
  }
}
