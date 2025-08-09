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

  // Get or create user profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      })
      .select()
      .single()
    profile = newProfile
  }

  // Get questions for this subject
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subjectId)
    .order('difficulty_level', { ascending: true })

  if (!questions || questions.length === 0) {
    redirect('/')
  }

  // Get user progress for this subject
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  return (
    <QuizInterface 
      user={user}
      profile={profile}
      subject={subject}
      questions={questions}
      userProgress={userProgress}
    />
  )
}