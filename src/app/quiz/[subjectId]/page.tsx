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

  // Get subject details
  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single()

  if (!subject) {
    redirect('/')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user progress for this subject
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  // Get questions for this subject (we'll implement adaptive selection later)
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subjectId)
    .order('difficulty_level')
    .limit(10)

  return (
    <QuizInterface 
      user={user}
      profile={profile}
      subject={subject}
      questions={questions || []}
      userProgress={userProgress}
    />
  )
}