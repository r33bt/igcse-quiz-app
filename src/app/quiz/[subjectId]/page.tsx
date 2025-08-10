import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizInterface from '@/components/QuizInterface'
import ErrorBoundary from '@/components/ErrorBoundary'

interface QuizPageProps {
  params: Promise<{ subjectId: string }>
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { subjectId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get subject details
  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single()

  if (!subject) {
    redirect('/')
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

  // Get questions for this subject
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subjectId)
    .order('difficulty_level', { ascending: true })

  if (!questions || questions.length === 0) {
    redirect('/')
  }

  // Parse options and validate question structure to prevent runtime errors
  const validatedQuestions = questions.map(q => {
    // Handle options: parse JSON strings to arrays if needed
    let parsedOptions = q.options
    if (typeof q.options === 'string') {
      try {
        parsedOptions = JSON.parse(q.options)
      } catch (parseError) {
        console.error(`Failed to parse options for question ${q.id}:`, parseError.message)
        parsedOptions = []
      }
    }
    
    return {
      ...q,
      options: parsedOptions
    }
  }).filter(q => {
    const hasRequiredFields = q.id && q.question_text && q.correct_answer
    const hasValidOptions = Array.isArray(q.options) && q.options.length > 0
    
    if (!hasRequiredFields || !hasValidOptions) {
      console.error('Invalid question structure after parsing:', q.id, {
        hasId: !!q.id,
        hasQuestionText: !!q.question_text,
        hasCorrectAnswer: !!q.correct_answer,
        hasValidOptions,
        optionsType: typeof q.options,
        optionsValue: q.options
      })
      return false
    }
    
    return true
  })

  if (validatedQuestions.length === 0) {
    console.error('No valid questions found after validation')
    redirect('/')
  }

  // Pass all questions to client - randomization will happen client-side
  console.log(`Loaded ${validatedQuestions.length} questions for client-side randomization`)

  // Get user progress for this subject
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_id', subjectId)
    .maybeSingle()

  return (
    <ErrorBoundary>
      <QuizInterface 
        user={user}
        profile={profile}
        subject={subject}
        questions={validatedQuestions}
        userProgress={userProgress}
      />
    </ErrorBoundary>
  )
}