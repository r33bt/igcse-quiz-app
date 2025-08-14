import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MathematicsHub from '@/components/MathematicsHub'
import ErrorBoundary from '@/components/ErrorBoundary'

export default async function MathematicsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get Mathematics subject
  const { data: mathSubject } = await supabase
    .from('subjects')
    .select('*')
    .eq('name', 'Mathematics')
    .single()

  if (!mathSubject) {
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

  // Get mathematics questions for overview
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', mathSubject.id)
    .order('difficulty_level', { ascending: true })

  // Get user's mathematics progress
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_id', mathSubject.id)
    .maybeSingle()

  // Get recent mathematics quiz attempts (last 10)
  const { data: recentAttempts } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      questions!inner(*)
    `)
    .eq('user_id', user.id)
    .eq('questions.subject_id', mathSubject.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get mathematics quiz sessions for history
  const { data: recentSessions } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_id', mathSubject.id)
    .order('completed_at', { ascending: false })
    .limit(5)

  return (
    <ErrorBoundary>
      <MathematicsHub 
        user={user}
        profile={profile}
        subject={mathSubject}
        questions={questions || []}
        userProgress={userProgress}
        recentAttempts={recentAttempts || []}
        recentSessions={recentSessions || []}
      />
    </ErrorBoundary>
  )
}