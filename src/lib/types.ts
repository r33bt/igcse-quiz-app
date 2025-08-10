export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  study_streak: number
  last_study_date: string | null
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  description: string | null
  icon: string | null
  color: string | null
  created_at: string
}

export interface Question {
  id: string
  subject_id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string | null
  difficulty_level: number
  topic: string | null
  curriculum_reference: string | null
  created_at: string
  subjects?: Subject
}

export interface QuizSession {
  id: string
  user_id: string
  subject_id: string
  started_at: string
  completed_at: string | null
  total_questions: number
  correct_answers: number
  total_xp_earned: number
  accuracy_percentage: number
  session_type: 'practice' | 'timed' | 'review'
  created_at: string
  subjects?: Subject
}

export interface QuizAttempt {
  id: string
  user_id: string
  question_id: string
  quiz_session_id: string | null
  question_order: number | null
  user_answer: string
  is_correct: boolean
  time_taken: number | null
  xp_earned: number
  difficulty_at_time: number | null
  created_at: string
  questions?: Question
  quiz_sessions?: QuizSession
}

export interface UserProgress {
  id: string
  user_id: string
  subject_id: string
  total_questions_answered: number
  correct_answers: number
  accuracy_percentage: number
  average_time_per_question: number
  current_difficulty_level: number
  weak_topics: string[]
  strong_topics: string[]
  last_practiced: string | null
  created_at: string
  updated_at: string
  subjects?: Subject
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition_type: string
  condition_value: number
  xp_reward: number
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievements?: Achievement
}

export interface StudySession {
  id: string
  user_id: string
  subject_id: string
  questions_answered: number
  correct_answers: number
  xp_earned: number
  duration_minutes: number | null
  started_at: string
  ended_at: string | null
  subjects?: Subject
}