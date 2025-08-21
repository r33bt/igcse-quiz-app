import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Question {
  id: string
  question_text: string
  difficulty_level: number
  timesAttempted?: number
  accuracy?: number
  neverAttempted?: boolean
}

interface QuestionAnalysisCardProps {
  question: Question
  index: number
  variant: 'attempted' | 'never-attempted'
}

export function QuestionAnalysisCard({ question, index, variant }: QuestionAnalysisCardProps) {
  const isAttempted = variant === 'attempted'
  
  return (
    <Card className={`p-3 ${isAttempted ? 'bg-gray-50' : 'bg-red-50 border-red-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-sm text-gray-700 flex-1">
          Q{index + 1}: {question.question_text.substring(0, 60)}...
        </div>
        <Badge variant="secondary" className="ml-2">
          Level {question.difficulty_level}
        </Badge>
      </div>
      
      {isAttempted ? (
        <div className="flex justify-between text-xs text-gray-600">
          <span>Attempted: {question.timesAttempted}x</span>
          <span>Accuracy: {question.accuracy}%</span>
          <span className={question.accuracy && question.accuracy >= 70 ? 'text-green-600' : 'text-red-600'}>
            {question.accuracy && question.accuracy >= 70 ? '🟢' : '🔴'}
          </span>
        </div>
      ) : (
        <div className="text-xs text-red-600">
          🚫 This question has never appeared in your quizzes
        </div>
      )}
    </Card>
  )
}
