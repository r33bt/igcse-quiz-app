'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardDataService } from '@/lib/services/DashboardDataService'

export default function DiagnosticPage() {
  const [data, setData] = useState<Record<string, any> | null>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkData() {
      const supabase = createClient()
      const dashboardService = new DashboardDataService()
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check total questions in database
        const { data: allQuestions } = await supabase.from('questions').select('id')
        
        // Check user's quiz attempts
        const { data: userAttempts } = await supabase.from('quiz_attempts').select('question_id').eq('user_id', user.id)
        
        // Check user's quiz sessions
        const { data: userSessions } = await supabase.from('quiz_sessions').select('*').eq('user_id', user.id)
        
        // Get dashboard service calculation
        const dashboardStats = await dashboardService.getUserProgress(user.id)
        
        const uniqueQuestionIds = [...new Set(userAttempts?.map(a => a.question_id) || [])]
        
        setData({
          totalQuestionsInDatabase: allQuestions?.length || 0,
          totalQuestionIdsInDatabase: allQuestions?.map(q => q.id) || [],
          userTotalAttempts: userAttempts?.length || 0,
          userUniqueQuestions: uniqueQuestionIds.length,
          userUniqueQuestionIds: uniqueQuestionIds,
          userTotalSessions: userSessions?.length || 0,
          dashboardServiceResult: dashboardStats
        })
      } catch (error) {
        console.error('Error checking data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkData()
  }, [])

  if (loading) return <div className="p-8">Loading diagnostic data...</div>

  if (!data) return <div className="p-8">No data available</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Database Diagnostic</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Questions Database</h2>
        <p><strong>Total questions in database:</strong> {data.totalQuestionsInDatabase}</p>
        <p><strong>Question IDs:</strong> {data.totalQuestionIdsInDatabase.join(', ')}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Your Quiz Activity</h2>
        <p><strong>Total quiz attempts:</strong> {data.userTotalAttempts}</p>
        <p><strong>Unique questions attempted:</strong> {data.userUniqueQuestions}</p>
        <p><strong>Unique question IDs attempted:</strong> {data.userUniqueQuestionIds.join(', ')}</p>
        <p><strong>Total quiz sessions:</strong> {data.userTotalSessions}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Dashboard Service Calculation</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(data.dashboardServiceResult, null, 2)}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900">Analysis</h3>
        <p className="text-blue-800">
          {data.userUniqueQuestions === 5 && data.totalQuestionsInDatabase > 5 
            ? `✅ You have attempted ${data.userUniqueQuestions} out of ${data.totalQuestionsInDatabase} available questions. The "5 Questions Answered" is CORRECT.`
            : data.userUniqueQuestions !== 5 
            ? `❌ Calculation mismatch: You've attempted ${data.userUniqueQuestions} unique questions but dashboard shows 5.`
            : `✅ Data appears consistent.`
          }
        </p>
      </div>
    </div>
  )
}

