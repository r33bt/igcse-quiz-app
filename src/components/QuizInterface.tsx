'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile, Subject, Question, UserProgress } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface QuizInterfaceProps {
  user: User
  profile: Profile | null
  subject: Subject
  questions: Question[]
  userProgress: UserProgress | null
}

export default function QuizInterface({ 
  user, 
  profile, 
  subject, 
  questions, 
  userProgress 
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
  
  const router = useRouter()
  const supabase = createClient()
  
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

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
      // Record the quiz attempt
      await supabase.from('quiz_attempts').insert([
        {
          user_id: user.id,
          question_id: currentQuestion.id,
          user_answer: selectedAnswer,
          is_correct: correct,
          time_taken: timeInSeconds,
          xp_earned: xpEarned,
          difficulty_at_time: currentQuestion.difficulty_level
        }
      ])

      // Update user XP
      if (profile) {
        await supabase
          .from('profiles')
          .update({ xp: (profile.xp || 0) + xpEarned })
          .eq('id', user.id)
      }

      // Update or create user progress
      const totalAnswered = (userProgress?.total_questions_answered || 0) + 1
      const correctAnswers = (userProgress?.correct_answers || 0) + (correct ? 1 : 0)
      const newAccuracy = (correctAnswers / totalAnswered) * 100

      await supabase
        .from('user_progress')
        .upsert([
          {
            user_id: user.id,
            subject_id: subject.id,
            total_questions_answered: totalAnswered,
            correct_answers: correctAnswers,
            accuracy_percentage: newAccuracy,
            average_time_per_question: timeInSeconds, // simplified for now
            current_difficulty_level: currentQuestion.difficulty_level,
            last_practiced: new Date().toISOString()
          }
        ])
        
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

  const showFinalResults = () => {
    const accuracy = Math.round((sessionScore / totalQuestions) * 100)
    alert(`Quiz completed!\n\nScore: ${sessionScore}/${totalQuestions} (${accuracy}%)\nXP Earned: ${sessionXP}\n\nGreat job!`)
    router.push('/')
  }

  const goHome = () => {
    router.push('/')
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No questions available</h2>
          <button
            onClick={goHome}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Go Back
          </button>
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
            {currentQuestion.options?.map((option, index) => (
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
            ))}
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