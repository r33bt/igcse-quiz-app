"use client"

import CoreExtendedComparison from '@/components/CoreExtendedComparison'
import AppNavigation from '@/components/AppNavigation'

export default function SyllabusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation title="IGCSE Syllabus" showBackButton={true} backUrl="/" />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <CoreExtendedComparison />
      </main>
    </div>
  )
}
