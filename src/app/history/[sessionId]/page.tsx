import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SessionReview from '@/components/SessionReview'
import AppNavigation from '@/components/AppNavigation'
import ErrorBoundary from '@/components/ErrorBoundary'

interface PageProps {
  params: Promise<{
    sessionId: string
  }>
}

export default async function SessionReviewPage({ params }: PageProps) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect('/login') }
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AppNavigation title="Session Review" showBackButton={true} backUrl="/history" />
        <SessionReview user={user} sessionId={sessionId} />
      </div>
    </ErrorBoundary>
  )
}
