console.log("=== DATABASE DIAGNOSTIC ===")

// This should be run in browser console on the dashboard page
// Check the actual database queries

const supabase = window.supabase || createClient()

async function checkRealData() {
  // Check questions table
  const { data: questions } = await supabase.from('questions').select('*')
  console.log('Total questions in database:', questions?.length)
  console.log('Question IDs:', questions?.map(q => q.id))
  
  // Check quiz_sessions 
  const { data: sessions } = await supabase.from('quiz_sessions').select('*').eq('user_id', 'current_user_id')
  console.log('Total quiz sessions:', sessions?.length)
  
  // Check quiz_attempts
  const { data: attempts } = await supabase.from('quiz_attempts').select('*').eq('user_id', 'current_user_id') 
  console.log('Total attempts:', attempts?.length)
  console.log('Unique question IDs in attempts:', [...new Set(attempts?.map(a => a.question_id))])
  
  return { questions, sessions, attempts }
}

checkRealData()
