import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SimpleAnswerReview from '@/components/SimpleAnswerReview'
import AppNavigation from '@/components/AppNavigation'
import ErrorBoundary from '@/components/ErrorBoundary'

export default async function ReviewPage() {
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
        avatar_url: user.user_metadata?.avatar_url,
        xp: 0,
        level: 1
      })
      .select()
      .single()
    profile = newProfile
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AppNavigation 
          title="Answer Review"
          showBackButton={true}
          backUrl="/"
        />

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <p className="text-gray-600">
              Review your recent quiz attempts to learn from mistakes and reinforce correct answers. 
              Click on any attempt to see detailed explanations and performance analysis.
            </p>
          </div>

          <SimpleAnswerReview user={user} />
        </main>
      </div>
    </ErrorBoundary>
  )
}


