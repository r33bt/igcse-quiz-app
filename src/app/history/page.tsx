import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SimpleQuizHistory from '@/components/SimpleQuizHistory'
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
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Quiz History</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {profile?.full_name || user.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        <SimpleQuizHistory user={user} profile={profile} />
      </div>
    </ErrorBoundary>
  )
}