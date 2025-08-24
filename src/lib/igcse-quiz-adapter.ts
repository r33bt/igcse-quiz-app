// src/lib/igcse-quiz-adapter.ts
import { User } from '@supabase/supabase-js'

// More flexible interfaces
interface IGCSESubtopic {
  id: string
  subtopic_code: string
  title: string
  description?: string
  difficulty_level: string
  igcse_topics?: {  // Made optional
    id: string
    topic_number: number
    title: string
    color: string
  } | null
}

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
  explanation: string | null
  difficulty: number
  difficulty_level: number
  topic: string
  curriculum_reference: string
  created_at: string
  question_type: string
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
   * Safe subject data transformation with fallbacks
   */
  static adaptSubjectData(subtopic: IGCSESubtopic): Subject {
    // Multiple fallback strategies
    const topics = subtopic.igcse_topics
    const topicId = topics?.id || subtopic.id || 'default-topic'
    const topicColor = topics?.color || '#3B82F6'
    const topicTitle = topics?.title || 'Mathematics'
    
    return {
      id: topicId,
      name: subtopic.title || 'IGCSE Mathematics',
      code: subtopic.subtopic_code || '1.1',
      color: topicColor,
      description: subtopic.description || `IGCSE Mathematics: ${subtopic.title || 'Quiz'}`,
      icon: '🎯',
      created_at: new Date().toISOString()
    }
  }

  /**
   * Enhanced question data transformation with better options handling
   */
  static adaptQuestionData(
    questions: AssessmentQuestion[], 
    subtopic: IGCSESubtopic
  ): QuizQuestion[] {
    const subjectId = subtopic.igcse_topics?.id || subtopic.id || 'default-topic'
    
    return questions.map(q => {
      // Enhanced options handling with multiple strategies
      let options: string[] = []
      
      try {
        if (Array.isArray(q.options)) {
          options = q.options.filter((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0)
        } else if (q.options && typeof q.options === 'object') {
          // Handle both object and string-ified JSON
          const optionsObj = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          if (Array.isArray(optionsObj)) {
            options = optionsObj.filter((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0)
          } else {
            options = Object.values(optionsObj)
              .filter((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0)
          }
        } else if (typeof q.options === 'string') {
          // Try to parse as JSON array first
          try {
            const parsed = JSON.parse(q.options)
            if (Array.isArray(parsed)) {
              options = parsed.filter((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0)
            } else {
              throw new Error('Not an array')
            }
          } catch {
            // Fallback: split by common delimiters
            const stringOptions = q.options as string // Type assertion since we know it's a string here
            options = stringOptions.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0)
          }
        }
        
        // Validate we have at least 2 options
        if (options.length < 2) {
          console.warn('Insufficient options for question:', q.id, 'options:', q.options)
          options = ['Option A', 'Option B', 'Option C', 'Option D']
        }
        
      } catch (error) {
        console.error('Failed to parse options for question:', q.id, error)
        options = ['Option A', 'Option B', 'Option C', 'Option D']
      }

      return {
        id: q.id || `question-${Math.random()}`,
        subject_id: subjectId,
        question_text: q.question_text || 'Question text missing',
        options: options,
        correct_answer: q.correct_answer || options[0] || 'A',
        explanation: q.explanation || null,
        difficulty: q.difficulty || 1,
        difficulty_level: q.difficulty || 1,
        topic: subtopic.title || 'Mathematics',
        curriculum_reference: subtopic.subtopic_code || '1.1',
        created_at: new Date().toISOString(),
        question_type: 'multiple_choice'
      }
    })
  }

  /**
   * Safe user data transformation
   */
  static adaptUserData(user?: User | null): User {
    if (user && user.id) return user
    
    // Fallback test user with proper structure
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
   * Create quiz metadata safely
   */
  static createQuizMetadata(
    subtopic: IGCSESubtopic, 
    paperPath: 'Core' | 'Extended',
    quizType: 'Assessment' | 'Practice' | 'Mastery'
  ) {
    return {
      subtopicId: subtopic.id || 'unknown',
      subtopicCode: subtopic.subtopic_code || '1.1',
      paperPath,
      quizType,
      startTime: new Date().toISOString()
    }
  }
}

// Export types
export type { IGCSESubtopic, Subject, QuizQuestion, AssessmentQuestion }
