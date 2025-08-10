import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import SessionReview from '@/components/SessionReview'
import ErrorBoundary from '@/components/ErrorBoundary'

interface SessionReviewPageProps {
  params: Promise<{ sessionId: string }>
}

export default async function SessionReviewPage({ params }: SessionReviewPageProps) {
  const { sessionId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
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

  return (
    <ErrorBoundary>
      <SessionReview 
        user={user} 
        profile={profile} 
        sessionId={sessionId}
      />
    </ErrorBoundary>
  )
}