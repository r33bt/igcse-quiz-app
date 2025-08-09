import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
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

  // Create profile if it doesn't exist
  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating profile:', insertError)
    } else {
      profile = newProfile
    }
  }

  // Get subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name')

  // Get user progress
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)

  return (
    <Dashboard 
      user={user} 
      profile={profile} 
      subjects={subjects || []} 
      userProgress={userProgress || []} 
    />
  )
}
