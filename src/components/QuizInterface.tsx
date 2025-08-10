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
  userProgress?: UserProgress | null // Made optional since it's not used
}

export default function QuizInterface({ 
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
        console.log('Questions:', randomizedQuestions.map(q => q.question_text.substring(0, 30) + '...'))
        
        // Try to create quiz session (optional - for history features)
        console.log('🎯 Attempting to create quiz session for enhanced features...')
        const session = await sessionManager.createSession(user.id, subject.id, 'practice')
        if (session) {
          setQuizSession(session)
          console.log('✅ Quiz session created - history features enabled:', session.id)
        } else {
          console.warn('⚠️ Quiz session creation failed - history features disabled, but quiz will work normally')
        }
        
        // Always mark as started regardless of session creation
        setQuizStarted(true)
        console.log('✅ Quiz fully initialized and ready for submissions')
      }
    }
    
    initializeQuiz()
  }, [questions, user.id, subject.id, quizStarted, sessionManager]) // Run when questions are available

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
    console.log('🔍 Submit attempt:', {
      selectedAnswer,
      hasCurrentQuestion: !!currentQuestion,
      hasStartTime: !!startTime,
      hasQuizSession: !!quizSession,
      quizSessionId: quizSession?.id
    })
    
    if (!selectedAnswer) {
      console.error('❌ Submit blocked: No answer selected')
      return
    }
    if (!currentQuestion) {
      console.error('❌ Submit blocked: No current question')
      return
    }
    if (!startTime) {
      console.error('❌ Submit blocked: No start time')
      return
    }
    
    // Quiz sessions are optional - quiz works without them
    if (!quizSession) {
      console.warn('⚠️ No quiz session - history features disabled, but quiz will continue')
    }
    
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
      // Try to record with session tracking first (for history feature)
      if (quizSession) {
        const attemptRecorded = await sessionManager.recordAttempt(
          user.id,
          quizSession.id,
          currentQuestion.id,
          selectedAnswer,
          correct,
          timeInSeconds,
          xpEarned,
          currentQuestion.difficulty_level,
          currentQuestionIndex + 1 // question order (1-based)
        )

        if (attemptRecorded) {
          console.log('✅ Quiz attempt recorded with session tracking')
        } else {
          console.warn('⚠️ Session tracking failed, falling back to basic recording')
        }
      }

      // Always record basic quiz attempt (original functionality)
      const { error: attemptError } = await supabase
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

      if (attemptError) {
        console.error('Error recording basic quiz attempt:', attemptError)
      } else {
        console.log('✅ Basic quiz attempt recorded successfully')
      }

      // Update or create user progress using UPSERT (without total_xp_earned - XP tracked in profiles)
      try {
        const { data: upsertedProgress, error: progressError } = await supabase
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
          .select()
          .single()

        if (progressError) {
          console.error('❌ Error upserting progress:', progressError.message)
          
          // Fallback: try to get existing progress and manually update
          const { data: existingProgress } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('subject_id', subject.id)
            .maybeSingle()

          if (existingProgress) {
            // Update existing record
            const newQuestionsAnswered = existingProgress.total_questions_answered + 1
            const newCorrectAnswers = existingProgress.correct_answers + (correct ? 1 : 0)
            const newAccuracy = Math.round((newCorrectAnswers / newQuestionsAnswered) * 100)
            // XP is tracked in profiles table, not user_progress

            const { error: updateError } = await supabase
              .from('user_progress')
              .update({
                total_questions_answered: newQuestionsAnswered,
                correct_answers: newCorrectAnswers,
                accuracy_percentage: newAccuracy,
                current_difficulty_level: currentQuestion.difficulty_level,
                last_practiced: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('subject_id', subject.id)

            if (updateError) {
              console.error('❌ Error updating existing progress:', updateError.message)
            } else {
              console.log('✅ Progress updated via fallback method')
            }
          } else {
            // Create new record
            const { error: insertError } = await supabase
              .from('user_progress')
              .insert({
                user_id: user.id,
                subject_id: subject.id,
                total_questions_answered: 1,
                correct_answers: correct ? 1 : 0,
                accuracy_percentage: correct ? 100 : 0,
                current_difficulty_level: currentQuestion.difficulty_level,
                last_practiced: new Date().toISOString()
              })

            if (insertError) {
              console.error('❌ Error creating new progress:', insertError.message)
            } else {
              console.log('✅ New progress record created')
            }
          }
        } else {
          console.log('✅ Progress updated successfully:', upsertedProgress)
        }
      } catch (progressUpdateError) {
        console.error('❌ Progress update failed completely:', progressUpdateError)
      }

      // Update user profile XP (optional - app works without this)
      if (profile) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              xp: (profile.xp || 0) + xpEarned,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (profileError) {
            console.warn('⚠️ Profile XP update failed (app continues normally):', profileError.message)
          } else {
            console.log('✅ Profile XP updated successfully')
          }
        } catch {
          console.warn('⚠️ Profile update skipped due to database constraints')
        }
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
      // Quiz completed, show results
      showFinalResults()
    }
  }

  const showFinalResults = async () => {
    const accuracy = Math.round((sessionScore / totalQuestions) * 100)
    
    // Try to complete quiz session if one exists (for history features)
    if (quizSession) {
      try {
        const completed = await sessionManager.completeSession(
          quizSession.id,
          totalQuestions,
          sessionScore,
          sessionXP
        )

        if (completed) {
          console.log('✅ Quiz session completed - review available in history')
          
          // Show completion dialog with option to review
          const reviewQuiz = confirm(
            `Quiz completed!\n\nScore: ${sessionScore}/${totalQuestions} (${accuracy}%)\nXP Earned: ${sessionXP}\n\nGreat job!\n\nWould you like to review your answers?`
          )
          
          if (reviewQuiz) {
            router.push(`/history/${quizSession.id}`)
            return
          }
        } else {
          console.warn('⚠️ Failed to complete quiz session - review not available')
        }
      } catch (error) {
        console.error('Error completing quiz session:', error)
      }
    }

    // Show completion screen instead of immediate redirect
    setShowCompletion(true)
  }

  const goHome = () => {
    router.push('/')
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

            {/* Results Summary */}
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

            {/* Action Buttons */}
            <div className="space-x-4">
              <button
                onClick={() => router.push(`/quiz/${subject.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
              >
                Take Another Quiz
              </button>
              <button
                onClick={() => router.push('/')}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={goHome}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back
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
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-yellow-500">⚡</div>
                <span className="font-semibold">+{sessionXP} XP</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                {currentQuestion.topic || 'General'}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                Level {currentQuestion.difficulty_level}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-6">
            {Array.isArray(currentQuestion.options) ? currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(option)}
                disabled={showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  showResult
                    ? option === currentQuestion.correct_answer
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : option === selectedAnswer && option !== currentQuestion.correct_answer
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                    : selectedAnswer === option
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3 text-xs font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </div>
              </button>
            )) : (
              <div className="p-4 text-center text-red-600">
                <p>Error loading answer options. Please refresh the page.</p>
                <p className="text-sm text-gray-500 mt-1">Options: {JSON.stringify(currentQuestion.options)}</p>
              </div>
            )}
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className={`p-4 rounded-lg mb-6 ${
              isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                <span className={`text-2xl mr-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {isCorrect ? '✅' : '❌'}
                </span>
                <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
                <span className="ml-auto text-yellow-600 font-semibold">
                  +{calculateXP(isCorrect, currentQuestion.difficulty_level, startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0)} XP
                </span>
              </div>
              {currentQuestion.explanation && (
                <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {currentQuestion.explanation}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {!showResult ? (
              <button
                onClick={submitAnswer}
                disabled={!selectedAnswer || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Answer'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{sessionScore}</div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalQuestions > 0 ? Math.round((sessionScore / (answeredQuestions.length || 1)) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Current Accuracy</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{sessionXP}</div>
            <div className="text-sm text-gray-600">XP Earned</div>
          </div>
        </div>
      </main>
    </div>
  )
}