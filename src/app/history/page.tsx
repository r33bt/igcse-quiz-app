import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizHistory from '@/components/QuizHistory'
import AppNavigation from '@/components/AppNavigation'
import ErrorBoundary from '@/components/ErrorBoundary'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AppNavigation 
          title="Quiz History" 
          showBackButton={true} 
          backUrl="/" 
        />
        <QuizHistory user={user} />
      </div>
    </ErrorBoundary>
  )
}
