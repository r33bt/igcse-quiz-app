import Link from 'next/link'

export default function DebugDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Application Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              <span>Static page loads successfully</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              <span>React components render properly</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              <span>No database queries executed yet</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✅' : 'Missing ❌'}
            </div>
            <div>
              <strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-2">
            <p>✅ This debug page loads without database queries</p>
            <p>🔍 Main dashboard fails due to server-side database queries</p>
            <p>🎯 Issue is in server-side data fetching, not client-side React</p>
          </div>
          
          <div className="mt-6">
            <Link 
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-4 inline-block"
            >
              Try Main Dashboard
            </Link>
            <Link 
              href="/guide"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-block"
            >
              View User Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}