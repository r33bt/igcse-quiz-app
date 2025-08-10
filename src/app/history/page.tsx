import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SimpleQuizHistory from '@/components/SimpleQuizHistory'
import AppNavigation from '@/components/AppNavigation'
import ErrorBoundary from '@/components/ErrorBoundary'

export default async function HistoryPage() {
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
          title="Quiz History"
          showBackButton={true}
          backUrl="/"
        />
        <SimpleQuizHistory user={user} profile={profile} />
      </div>
    </ErrorBoundary>
  )
}