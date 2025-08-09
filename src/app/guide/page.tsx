import Link from 'next/link'

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">IGCSE Quiz App - User Guide</h1>
            <Link 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 How It Works</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Choose a Subject</h4>
                    <p className="text-gray-600 text-sm">Select from available IGCSE subjects on your dashboard</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Answer Questions</h4>
                    <p className="text-gray-600 text-sm">Work through multiple-choice questions at your level</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Earn XP & Level Up</h4>
                    <p className="text-gray-600 text-sm">Get points for correct answers, bonus for speed</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Track Progress</h4>
                    <p className="text-gray-600 text-sm">Monitor your accuracy and improvement over time</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* XP & Leveling System */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">⚡ XP & Leveling System</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">How to Earn XP:</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• <strong>Correct Answer:</strong> 20-100 XP (based on difficulty)</li>
                    <li>• <strong>Speed Bonus:</strong> +50% XP for answers under 10 seconds</li>
                    <li>• <strong>Quick Bonus:</strong> +20% XP for answers under 20 seconds</li>
                    <li>• <strong>Consolation XP:</strong> 10 XP even for wrong answers</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Level System:</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• <strong>Level 1:</strong> 0-999 XP</li>
                    <li>• <strong>Level 2:</strong> 1000-1999 XP</li>
                    <li>• <strong>Level 3:</strong> 2000-2999 XP</li>
                    <li>• <strong>And so on...</strong> (Every 1000 XP = new level)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Dashboard Explained */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Understanding Your Dashboard</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Total Questions</h4>
                <p className="text-blue-700 text-sm">Number of questions you&apos;ve attempted across all subjects</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ Overall Accuracy</h4>
                <p className="text-green-700 text-sm">Your average success rate across all subjects</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">🔥 Study Streak</h4>
                <p className="text-orange-700 text-sm">Consecutive days you&apos;ve practiced (feature coming soon)</p>
              </div>
            </div>
          </section>

          {/* Current Features */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">✅ Current Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">🟢 Working Features:</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>✓ User registration &amp; authentication</li>
                  <li>✓ Subject selection (Mathematics, etc.)</li>
                  <li>✓ Multiple-choice questions</li>
                  <li>✓ Real-time feedback &amp; explanations</li>
                  <li>✓ XP earning system</li>
                  <li>✓ Level progression</li>
                  <li>✓ Progress tracking per subject</li>
                  <li>✓ Session stats during quiz</li>
                  <li>✓ Accuracy percentage calculation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-orange-700 mb-2">🟡 Coming Soon:</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>⏳ Study streak tracking</li>
                  <li>⏳ Achievements &amp; badges</li>
                  <li>⏳ More IGCSE subjects</li>
                  <li>⏳ Adaptive difficulty system</li>
                  <li>⏳ Topic-specific practice</li>
                  <li>⏳ Performance analytics</li>
                  <li>⏳ Leaderboards</li>
                  <li>⏳ Custom study sessions</li>
                  <li>⏳ Question favorites</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Known Issues */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Known Issues & Limitations</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <ul className="text-red-700 text-sm space-y-2">
                <li>• <strong>Limited Question Bank:</strong> Currently has sample questions - more content needed</li>
                <li>• <strong>Question Count Display:</strong> May show incorrect totals due to database aggregation</li>
                <li>• <strong>Subject Availability:</strong> Only Mathematics has questions currently</li>
                <li>• <strong>Study Streak:</strong> Feature implemented but not fully functional</li>
                <li>• <strong>Email Confirmation:</strong> Currently disabled for easier signup</li>
              </ul>
            </div>
          </section>

          {/* Tips for Best Experience */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">💡 Tips for Best Experience</h3>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-indigo-900 mb-2">Study Strategy:</h4>
                  <ul className="text-indigo-700 text-sm space-y-1">
                    <li>• Practice regularly for better retention</li>
                    <li>• Focus on accuracy first, speed second</li>
                    <li>• Read explanations even for correct answers</li>
                    <li>• Take breaks between long study sessions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-900 mb-2">Maximize XP:</h4>
                  <ul className="text-indigo-700 text-sm space-y-1">
                    <li>• Answer quickly but accurately</li>
                    <li>• Aim for under 10 seconds for speed bonus</li>
                    <li>• Don&apos;t worry about wrong answers - you still get XP!</li>
                    <li>• Higher difficulty questions give more XP</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Support */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🆘 Need Help?</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                This app is continuously being improved. If you encounter any issues or have suggestions:
              </p>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Check this guide first for common questions</li>
                <li>• Try refreshing the page if something isn&apos;t working</li>
                <li>• Your progress is saved automatically</li>
                <li>• Sign out and back in if you experience sync issues</li>
              </ul>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}