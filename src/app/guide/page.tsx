import Link from 'next/link'
import AppNavigation from '@/components/AppNavigation'

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation title="User Guide" showBackButton={true} backUrl="/" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-8 space-y-8">

          {/* Welcome Section */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to IGCSE Quiz App! 🎓</h2>
            <p className="text-gray-600 text-lg">
              A gamified learning platform designed to help IGCSE students master their subjects through
              interactive quizzes, XP rewards, and progress tracking.
            </p>
          </section>

          {/* How It Works */}
          <section>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              🎯 How It Works
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Choose a Subject</h4>
                    <p className="text-gray-600 text-sm">Select from available IGCSE subjects on your dashboard</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Answer Questions</h4>
                    <p className="text-gray-600 text-sm">Work through multiple-choice questions at your level</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Earn XP & Level Up</h4>
                    <p className="text-gray-600 text-sm">Get points for correct answers, bonus for speed</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Track Progress</h4>
                    <p className="text-gray-600 text-sm">Monitor your accuracy and improvement over time</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* XP System */}
          <section>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              ⚡ XP & Leveling System
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">How to Earn XP:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Correct Answer: Base XP (varies by difficulty)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Speed Bonus: Extra XP for quick answers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Streak Bonus: Consecutive correct answers
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Level System:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Level 1 (Easy): Foundation questions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Level 2 (Medium): Intermediate challenges
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Level 3 (Hard): Advanced problems
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Getting Started */}
          <section className="border-t pt-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">🚀 Ready to Start?</h3>
            <p className="text-gray-600 mb-6">
              Head to your dashboard and select a subject to begin your learning journey!
            </p>
            
            <div className="flex gap-4">
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
              
              <Link
                href="/mathematics"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Mathematics Quiz
              </Link>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
