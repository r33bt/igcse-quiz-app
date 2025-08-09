export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong></p>
        <code className="bg-gray-100 p-2 block break-all">
          {process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'}
        </code>
        
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong></p>
        <code className="bg-gray-100 p-2 block break-all">
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 50)}...` : 
            'MISSING'}
        </code>
        
        <p><strong>URL Type:</strong> {typeof process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p><strong>URL Length:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0}</p>
      </div>
    </div>
  )
}