import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SessionReview from '@/components/SessionReview'
import AppNavigation from '@/components/AppNavigation'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function SessionHistoryPage({ params }: Props) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AppNavigation 
          user={user} 
          profile={profile} 
          title="Quiz Session Review"
          showBackButton={true}
          backUrl="/history"
        />
        <main className="container mx-auto px-4 py-8">
          <SessionReview 
            user={user} 
            profile={profile} 
            sessionId={sessionId} 
          />
        </main>
      </div>
    </ErrorBoundary>
  )
}
