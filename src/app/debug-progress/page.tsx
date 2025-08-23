"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DebugProgress() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    testProgressQueries()
  }, [])

  const testProgressQueries = async () => {
    console.log("🔍 Starting progress debug tests...")
    
    try {
      // Test 1: Direct query for our test user
      const { data: test1, error: error1 } = await supabase
        .from('user_subtopic_progress')
        .select('*')
        .eq('user_id', 'a1b2c3d4-e5f6-7890-1234-567890abcdef')
      
      console.log("Test 1 - Direct user query:", { data: test1, error: error1 })
      
      // Test 2: Count all records for test user
      const { count, error: error2 } = await supabase
        .from('user_subtopic_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', 'a1b2c3d4-e5f6-7890-1234-567890abcdef')
      
      console.log("Test 2 - Count query:", { count, error: error2 })
      
      // Test 3: Get all records (no filter)
      const { data: test3, error: error3 } = await supabase
        .from('user_subtopic_progress')
        .select('user_id, current_mastery_level, mastery_percentage')
        .limit(10)
      
      console.log("Test 3 - All records:", { data: test3, error: error3 })
      
      setResults([
        { test: 'Direct user query', data: test1, error: error1 },
        { test: 'Count query', count, error: error2 },
        { test: 'All records sample', data: test3, error: error3 }
      ])
      
    } catch (error) {
      console.error("Debug error:", error)
      setResults([{ test: 'Error', error }])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Running debug tests...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Progress Debug Results</h1>
      
      {results.map((result, i) => (
        <div key={i} className="mb-6 p-4 border rounded">
          <h3 className="font-bold">{result.test}</h3>
          <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ))}
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-bold">Expected Result:</h3>
        <p>Direct user query should return 8 records with mastery levels like "Developing", "Proficient", "Mastery"</p>
      </div>
    </div>
  )
}
