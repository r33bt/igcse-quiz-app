import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizInterface from '@/components/QuizInterface'

interface QuizPageProps {
  params: Promise<{ subjectId: string }>
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { subjectId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Mock data for debugging - temporarily avoid database queries
  const mockSubject = {
    id: subjectId,
    name: 'Mathematics',
    code: 'MATH',
    description: 'IGCSE Mathematics',
    icon: 'calculator',
    color: '#3B82F6',
    created_at: new Date().toISOString()
  }

  const mockProfile = {
    id: user.id,
    email: user.email || null,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    xp: 20,
    level: 1,
    study_streak: 0,
    last_study_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockQuestions = [
    {
      id: '1',
      subject_id: subjectId,
      question_text: 'What is 2 + 2?',
      question_type: 'multiple_choice',
      options: ['3', '4', '5', '6'],
      correct_answer: '4',
      explanation: '2 + 2 = 4 (basic addition)',
      difficulty_level: 1,
      topic: 'Algebra',
      curriculum_reference: 'MATH-ALG-001',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      subject_id: subjectId,
      question_text: 'What is 3 × 5?',
      question_type: 'multiple_choice',
      options: ['12', '15', '18', '20'],
      correct_answer: '15',
      explanation: '3 × 5 = 15 (basic multiplication)',
      difficulty_level: 1,
      topic: 'Number',
      curriculum_reference: 'MATH-NUM-001',
      created_at: new Date().toISOString()
    }
  ]

  return (
    <QuizInterface 
      user={user}
      profile={mockProfile}
      subject={mockSubject}
      questions={mockQuestions}
      userProgress={null}
    />
  )
}