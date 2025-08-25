'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-red-600 mb-4">Oops!</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-8">An unexpected error occurred. Please try again.</p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
