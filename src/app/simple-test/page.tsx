"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SimpleTest() {
  const [result, setResult] = useState<string>("")

  useEffect(() => {
    const runTest = async () => {
      try {
        const { data, error } = await supabase
          .from("user_subtopic_progress")
          .select("current_mastery_level, mastery_percentage")
          .eq("user_id", "a1b2c3d4-e5f6-7890-1234-567890abcdef")

        if (data && data.length > 0) {
          setResult(`SUCCESS: Found ${data.length} records!`)
        } else {
          setResult(`FAILURE: No records found`)
        }
      } catch (err) {
        setResult(`ERROR: ${err}`)
      }
    }
    runTest()
  }, [])

  return (
    <div className="p-8">
      <h1>Ultra Simple Test</h1>
      <div>{result || "Running test..."}</div>
    </div>
  )
}
