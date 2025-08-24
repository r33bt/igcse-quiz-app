// src/lib/igcse-quiz-adapter.ts
import { User } from '@supabase/supabase-js'

// Type definitions based on the error message and common patterns
interface Subject {
  id: string
  name: string
  code: string
  color: string
  description: string
  icon: string
  created_at: string
}

interface QuizQuestion {
  id: string
  subject_id: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation?: string
  difficulty: number
  difficulty_level: number
  topic: string
  curriculum_reference: string
  created_at: string
  question_type: string
}

interface IGCSESubtopic {
  id: string
  subtopic_code: string
  title: string
  description: string
  difficulty_level: string
  igcse_topics: {
    id: string
    topic_number: number
    title: string
    color: string
  }
}

interface AssessmentQuestion {
  id: string
  question_text: string
  options: string[] | Record<string, string>
  correct_answer: string
  explanation?: string
  difficulty: number
  difficulty_label: string
  question_category: string
  paper_type: string
}

export class IGCSEQuizAdapter {
  /**
   * Transform IGCSE subtopic data to QuizInterface Subject format
   */
  static adaptSubjectData(subtopic: IGCSESubtopic): Subject {
    return {
      id: subtopic.igcse_topics.id,
      name: subtopic.title,
      code: subtopic.subtopic_code,
      color: subtopic.igcse_topics.color,
      description: subtopic.description || `IGCSE Mathematics: ${subtopic.title}`,
      icon: '🎯', // Standard IGCSE Mathematics icon
      created_at: new Date().toISOString()
    }
  }

  /**
   * Transform AssessmentEngine questions to QuizInterface format
   */
  static adaptQuestionData(
    questions: AssessmentQuestion[], 
    subtopic: IGCSESubtopic
  ): QuizQuestion[] {
    return questions.map(q => ({
      id: q.id,
      subject_id: subtopic.igcse_topics.id,
      question_text: q.question_text,
      options: Array.isArray(q.options) 
        ? q.options 
        : Object.values(q.options || {}),
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      difficulty_level: q.difficulty, // Map to expected field
      topic: subtopic.title,
      curriculum_reference: subtopic.subtopic_code,
      created_at: new Date().toISOString(),
      question_type: 'multiple_choice'
    }))
  }

  /**
   * Create or adapt user data for QuizInterface
   */
  static adaptUserData(user?: User | null): User {
    if (user) return user
    
    // Fallback test user for development
    return {
      id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      email: 'test@igcse.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User
  }

  /**
   * Create quiz session metadata
   */
  static createQuizMetadata(
    subtopic: IGCSESubtopic, 
    paperPath: 'Core' | 'Extended',
    quizType: 'Assessment' | 'Practice' | 'Mastery'
  ) {
    return {
      subtopicId: subtopic.id,
      subtopicCode: subtopic.subtopic_code,
      paperPath,
      quizType,
      startTime: new Date().toISOString()
    }
  }
}

// Export types for use in other files
export type { Subject, QuizQuestion, IGCSESubtopic, AssessmentQuestion }