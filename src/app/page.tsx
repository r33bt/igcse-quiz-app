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

  // Create profile if it doesn't exist (with better error handling)
  if (!profile) {
    console.log('🔄 Creating missing profile for user:', user.id)
    
    // Try to create profile with fallback handling
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        xp: 0,
        level: 1
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating profile:', insertError.message)
      
      // Create a minimal profile object for the app to work
      profile = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        xp: 0,
        level: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: null,
        study_streak: 0
      }
      console.log('⚠️ Using fallback profile object')
    } else {
      profile = newProfile
      console.log('✅ Profile created successfully')
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
