import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Temporarily use minimal data to debug the issue
  const mockProfile = {
    id: user.id,
    email: user.email || null,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    xp: 0,
    level: 1,
    study_streak: 0,
    last_study_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockSubjects = [
    {
      id: '30707aa5-bb17-4555-a2a9-77155f3c77c7',
      name: 'Mathematics',
      code: 'MATH',
      description: 'IGCSE Mathematics',
      icon: 'calculator',
      color: '#3B82F6',
      created_at: new Date().toISOString()
    }
  ]

  return (
    <Dashboard 
      user={user} 
      profile={mockProfile} 
      subjects={mockSubjects} 
      userProgress={[]} 
    />
  )
}
