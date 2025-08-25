'use client'

import { useState, useEffect, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, Subject, Question, UserProgress, QuizSession } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { QuizSessionManager } from '@/lib/quiz-sessions'
import { useRouter } from 'next/navigation'

interface QuizInterfaceProps {
  user: User
  profile: Profile | null
  subject: Subject
  questions: Question[]
  userProgress?: UserProgress | null
}

export default function QuizInterfaceV2({ 
  user, 
  profile, 
  subject, 
  questions
}: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [showCompletion, setShowCompletion] = useState(false)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()
  const sessionManager = useMemo(() => new QuizSessionManager(), [])
  
  // Client-side randomization and limiting
  const shuffleArray = (array: Question[]): Question[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  const currentQuestion = quizQuestions[currentQuestionIndex]
  const totalQuestions = quizQuestions.length

  // Initialize quiz session and randomize questions when component mounts
  useEffect(() => {
    const initializeQuiz = async () => {
      if (!quizStarted && questions.length > 0) {
        console.log('🎯 Initializing quiz with randomized questions...')
        
        // Randomize and limit questions (8 questions max)
        const QUESTIONS_PER_QUIZ = Math.min(8, questions.length)
        const randomizedQuestions = shuffleArray(questions).slice(0, QUESTIONS_PER_QUIZ)
        setQuizQuestions(randomizedQuestions)
        
        console.log(`Selected ${randomizedQuestions.length} random questions from ${questions.length} available`)
        
        // Try to create quiz session (optional - for history features)
        const session = await sessionManager.createSession(user.id, subject.id, 'practice')
        if (session) {
          setQuizSession(session)
          console.log('✅ Quiz session created - history features enabled:', session.id)
        } else {
          console.warn('⚠️ Quiz session creation failed - history features disabled, but quiz will work normally')
        }
        
        setQuizStarted(true)
        console.log('✅ Quiz fully initialized and ready for submissions')
      }
    }
    
    initializeQuiz()
  }, [questions, user.id, subject.id, quizStarted, sessionManager])

  useEffect(() => {
    setStartTime(new Date())
  }, [currentQuestionIndex])

  const calculateXP = (isCorrect: boolean, difficulty: number, timeInSeconds: number): number => {
    if (!isCorrect) return 10 // consolation XP
    
    let baseXP = difficulty * 20 // 20-100 XP based on difficulty
    
    // Time bonus: extra XP for quick answers
    if (timeInSeconds <= 10) baseXP *= 1.5
    else if (timeInSeconds <= 20) baseXP *= 1.2
    
    return Math.round(baseXP)
  }

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || !startTime) return
    
    setLoading(true)
    
    const endTime = new Date()
    const timeInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    const correct = selectedAnswer === currentQuestion.correct_answer
    const xpEarned = calculateXP(correct, currentQuestion.difficulty_level, timeInSeconds)
    
    setIsCorrect(correct)
    setShowResult(true)
    
    if (correct) {
      setSessionScore(sessionScore + 1)
    }
    setSessionXP(sessionXP + xpEarned)
    
    try {
      // Record quiz attempt
      if (quizSession) {
        await sessionManager.recordAttempt(
          user.id,
          quizSession.id,
          currentQuestion.id,
          selectedAnswer,
          correct,
          timeInSeconds,
          xpEarned,
          currentQuestion.difficulty_level,
          currentQuestionIndex + 1
        )
      }

      await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          user_answer: selectedAnswer,
          is_correct: correct,
          time_taken: timeInSeconds,
          xp_earned: xpEarned,
          difficulty_at_time: currentQuestion.difficulty_level
        })

      // Update user progress and profile XP (simplified)
      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          subject_id: subject.id,
          total_questions_answered: 1,
          correct_answers: correct ? 1 : 0,
          accuracy_percentage: correct ? 100 : 0,
          current_difficulty_level: currentQuestion.difficulty_level,
          last_practiced: new Date().toISOString()
        }, {
          onConflict: 'user_id, subject_id',
          ignoreDuplicates: false
        })

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            xp: (profile.xp || 0) + xpEarned,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      }
        
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
    
    setAnsweredQuestions([...answeredQuestions, currentQuestion.id])
    setLoading(false)
  }

  const nextQuestion = () => {
    setSelectedAnswer(null)
    setShowResult(false)
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      showFinalResults()
    }
  }

  const showFinalResults = async () => {
    const accuracy = Math.round((sessionScore / totalQuestions) * 100)
    
    if (quizSession) {
      try {
        const completed = await sessionManager.completeSession(
          quizSession.id,
          totalQuestions,
          sessionScore,
          sessionXP
        )

        if (completed) {
          const reviewQuiz = confirm(
            `Quiz completed!\n\nScore: ${sessionScore}/${totalQuestions} (${accuracy}%)\nXP Earned: ${sessionXP}\n\nGreat job!\n\nWould you like to review your answers?`
          )
          
          if (reviewQuiz) {
            router.push(`/history/${quizSession.id}`)
            return
          }
        }
      } catch (error) {
        console.error('Error completing quiz session:', error)
      }
    }

    setShowCompletion(true)
  }

  const goHome = () => {
    // Check for custom return URL from quiz pages
    const customReturnUrl = localStorage.getItem('quiz_return_url')
    if (customReturnUrl) {
      localStorage.removeItem('quiz_return_url') // Clean up
      router.push(customReturnUrl)
    } else {
      router.push('/') // Fallback to dashboard
    }
  }

  // Show loading while questions are being randomized
  if (!currentQuestion || quizQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          {questions.length > 0 ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparing your quiz...</h2>
              <p className="text-gray-600">Selecting {Math.min(8, questions.length)} random questions</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No questions available</h2>
              <button
                onClick={goHome}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Go Back
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Show completion screen
  if (showCompletion) {
    const accuracy = Math.round((sessionScore / totalQuestions) * 100)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <div className="text-green-600 text-4xl">🎉</div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Quiz Completed!</h1>
              <p className="text-xl text-gray-600">Great job on completing the {subject.name} quiz!</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{sessionScore}/{totalQuestions}</div>
                  <div className="text-gray-600">Questions Correct</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    accuracy >= 80 ? 'text-green-600' : 
                    accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {accuracy}%
                  </div>
                  <div className="text-gray-600">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{sessionXP}</div>
                  <div className="text-gray-600">XP Earned</div>
                </div>
              </div>

              <div className="text-center">
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                  accuracy >= 80 ? 'bg-green-100 text-green-800' :
                  accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {accuracy >= 80 ? '🌟 Excellent work!' :
                   accuracy >= 60 ? '👍 Good effort!' : '💪 Keep practicing!'}
                </div>
              </div>
            </div>

            <div className="space-x-4">
              <button
                onClick={() => router.push(`/quiz/${subject.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
              >
                Take Another Quiz
              </button>
              <button
                onClick={goHome}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
              >
                Back to Dashboard
              </button>
            </div>

            {quizSession && (
              <div className="mt-4">
                <button
                  onClick={() => router.push(`/history/${quizSession.id}`)}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Review Your Answers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentAccuracy = answeredQuestions.length > 0 
    ? Math.round((sessionScore / answeredQuestions.length) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simplified Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={goHome}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
                onMouseEnter={() => setShowTooltip('back')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <span className="text-lg mr-2">←</span>
                Back to Dashboard
                {showTooltip === 'back' && (
                  <div className="absolute left-0 top-full mt-1 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                    Return to your dashboard
                  </div>
                )}
              </button>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                  style={{ backgroundColor: subject.color || '#3B82F6' }}
                >
                  {subject.name.charAt(0)}
                </div>
                <h1 className="text-xl font-bold text-gray-900">{subject.name}</h1>
              </div>
            </div>
            
            {/* Condensed Right Header Stats */}
            <div className="flex items-center space-x-6">
              <div 
                className="flex items-center text-sm text-gray-600"
                onMouseEnter={() => setShowTooltip('progress')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <span className="mr-2">📊</span>
                {currentQuestionIndex + 1} of {totalQuestions}
                {showTooltip === 'progress' && (
                  <div className="absolute top-full mt-1 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                    Your quiz progress
                  </div>
                )}
              </div>
              
              <div 
                className="flex items-center"
                onMouseEnter={() => setShowTooltip('xp')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <span className="text-yellow-500 mr-1">⚡</span>
                <span className="font-semibold text-yellow-600">{sessionXP}</span>
                {showTooltip === 'xp' && (
                  <div className="absolute top-full mt-1 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                    XP Points Earned
                  </div>
                )}
              </div>

              {/* Help/Guide Button */}
              <button
                onClick={() => router.push('/guide')}
                className="text-gray-500 hover:text-blue-600 text-lg"
                onMouseEnter={() => setShowTooltip('help')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                ❓
                {showTooltip === 'help' && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                    Get help & guides
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Quiz Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm font-medium text-gray-600">
              {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% Complete
            </span>
          </div>
        </div>

        {/* Question Card - Cleaner Design */}
        <div className="bg-white rounded-xl shadow-lg border-0 p-8 mb-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  📚 {currentQuestion.topic || 'General'}
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                  Level {currentQuestion.difficulty_level}
                </span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-relaxed mb-8">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Answer Options - Better Spacing */}
          <div className="space-y-4 mb-8">
            {Array.isArray(currentQuestion.options) ? currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(option)}
                disabled={showResult}
                className={`w-full p-5 text-left rounded-xl border-2 transition-all font-medium text-lg ${
                  showResult
                    ? option === currentQuestion.correct_answer
                      ? 'bg-green-50 border-green-400 text-green-700 shadow-green-200 shadow-md'
                      : option === selectedAnswer && option !== currentQuestion.correct_answer
                      ? 'bg-red-50 border-red-400 text-red-700 shadow-red-200 shadow-md'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                    : selectedAnswer === option
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-blue-200 shadow-md transform scale-105'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 text-sm font-bold ${
                    showResult && option === currentQuestion.correct_answer
                      ? 'border-green-500 bg-green-100 text-green-700'
                      : showResult && option === selectedAnswer && option !== currentQuestion.correct_answer
                      ? 'border-red-500 bg-red-100 text-red-700'
                      : selectedAnswer === option
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-current'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            )) : (
              <div className="p-4 text-center text-red-600">
                <p>Error loading answer options. Please refresh the page.</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {!showResult && (
            <div className="flex justify-center mb-6">
              <button
                onClick={submitAnswer}
                disabled={!selectedAnswer || loading}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                  selectedAnswer && !loading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? '⏳ Checking...' : '✅ Submit Answer'}
              </button>
            </div>
          )}
        </div>

        {/* Separated Feedback Section - Much Clearer */}
        {showResult && (
          <div className="mb-8">
            <div className={`p-6 rounded-xl border-l-4 ${
              isCorrect 
                ? 'bg-green-50 border-l-green-500 border border-green-200' 
                : 'bg-red-50 border-l-red-500 border border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className={`text-3xl mr-3 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? '🎉' : '💪'}
                  </span>
                  <span className={`font-bold text-xl ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Great job!' : 'Keep learning!'}
                  </span>
                </div>
                <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                  <span className="text-yellow-600 mr-1">⚡</span>
                  <span className="font-semibold text-yellow-700">
                    +{calculateXP(isCorrect, currentQuestion.difficulty_level, startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0)} XP
                  </span>
                </div>
              </div>
              {currentQuestion.explanation && (
                <div className={`text-base leading-relaxed ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  <strong className="block mb-2">Step-by-step solution:</strong>
                  <div className="pl-4 space-y-1">
                    {currentQuestion.explanation.split('.').filter(step => step.trim()).map((step, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="font-bold text-sm mt-0.5">
                          {index + 1}.
                        </span>
                        <span>{step.trim()}.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={nextQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                {currentQuestionIndex < totalQuestions - 1 ? '➡️ Next Question' : '🎊 Finish Quiz'}
              </button>
            </div>
          </div>
        )}

        {/* Condensed Stats Footer */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex justify-center items-center space-x-8">
            <div 
              className="text-center cursor-help"
              onMouseEnter={() => setShowTooltip('score')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div className="flex items-center justify-center space-x-1">
                <span className="text-blue-600 font-bold text-lg">{sessionScore}</span>
                <span className="text-gray-500">/</span>
                <span className="text-gray-600">{answeredQuestions.length || 0}</span>
              </div>
              <div className="text-xs text-gray-500">Correct</div>
              {showTooltip === 'score' && (
                <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                  Questions answered correctly
                </div>
              )}
            </div>
            
            <div 
              className="text-center cursor-help"
              onMouseEnter={() => setShowTooltip('accuracy')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div className="text-lg font-bold text-green-600">{currentAccuracy}%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
              {showTooltip === 'accuracy' && (
                <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                  Your current accuracy rate
                </div>
              )}
            </div>
            
            <div 
              className="text-center cursor-help"
              onMouseEnter={() => setShowTooltip('totalxp')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div className="flex items-center justify-center">
                <span className="text-yellow-500 mr-1">⚡</span>
                <span className="text-lg font-bold text-yellow-600">{sessionXP}</span>
              </div>
              <div className="text-xs text-gray-500">XP Total</div>
              {showTooltip === 'totalxp' && (
                <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs py-1 px-2 rounded z-10">
                  Total experience points earned this quiz
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
