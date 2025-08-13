# IGCSE Quiz App V2 - Technical Specification

**Version**: 2.0  
**Date**: 2025-08-10  
**Status**: Planning Phase - Complete Architecture  

## 1. Project Overview

### 1.1 Purpose
An adaptive learning platform for IGCSE Mathematics (Extended 0580) that helps students learn through smart question selection and immediate feedback.

### 1.2 Phase 1 Scope (Basic Learning Mode)
- User authentication
- Topic-based easy question practice (5 questions per quiz)
- Immediate feedback after each question
- Basic XP system and progress tracking
- Clean, simple dashboard

## 2. Architecture Design

### 2.1 System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - Auth API      │    │ - Users         │
│ - Quiz Engine   │    │ - Questions API │    │ - Questions     │
│ - Results       │    │ - Progress API  │    │ - Attempts      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Component Architecture
```
App
├── AuthProvider (Context)
├── Layout
│   ├── Header (User info, logout)
│   └── Navigation
├── Dashboard
│   ├── TopicCard (Algebra, Geometry, etc.)
│   ├── ProgressSummary (XP, Level, Streak)
│   └── RecentActivity
├── QuizEngine
│   ├── QuizSetup (Topic selection, difficulty)
│   ├── Question (Display question, options)
│   ├── Feedback (Correct/incorrect with explanation)
│   └── Results (Score, XP earned, next steps)
└── ErrorBoundary (Global error handling)
```

## 3. Data Model

### 3.1 Database Schema
```sql
-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  last_activity DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics (subjects/areas)
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Algebra", "Geometry"
  description TEXT,
  icon TEXT, -- Icon name for UI
  color TEXT, -- Hex color code
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions bank
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id),
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB NOT NULL, -- ["A) option", "B) option", "C) option", "D) option"]
  correct_answer TEXT NOT NULL, -- "A) option"
  explanation TEXT,
  curriculum_ref TEXT, -- IGCSE reference code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts (completed quizzes)
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  topic_id UUID REFERENCES topics(id),
  difficulty_level INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  xp_earned INTEGER DEFAULT 0,
  questions_asked JSONB NOT NULL, -- Array of question IDs
  user_answers JSONB NOT NULL, -- Array of user's answers
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress per topic
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  topic_id UUID REFERENCES topics(id),
  mastery_level INTEGER DEFAULT 1, -- 1-5 scale
  total_attempts INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);
```

### 3.2 Row Level Security Policies
```sql
-- Profiles: Users can only see/modify their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Quiz attempts: Users can only see/create their own
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User progress: Users can only see/modify their own
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- Topics and Questions: Readable by all authenticated users
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics viewable by authenticated users" ON topics FOR SELECT TO authenticated USING (true);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by authenticated users" ON questions FOR SELECT TO authenticated USING (true);
```

## 4. Component Specifications

### 4.1 Dashboard Component
```typescript
interface DashboardProps {
  user: User;
  profile: Profile;
  topics: Topic[];
  progress: UserProgress[];
}

// Responsibilities:
// - Display available topics as cards
// - Show user's current XP, level, streak
// - Display recent quiz attempts
// - Handle topic selection for new quiz
```

### 4.2 QuizEngine Component
```typescript
interface QuizEngineProps {
  topicId: string;
  difficulty: number;
  questionCount: number;
}

interface QuizState {
  questions: Question[];
  currentIndex: number;
  userAnswers: string[];
  showFeedback: boolean;
  isComplete: boolean;
  startTime: Date;
}

// Responsibilities:
// - Fetch random questions from selected topic/difficulty
// - Present questions one by one
// - Collect user answers
// - Show immediate feedback
// - Calculate final score and XP
// - Save attempt to database
```

### 4.3 Question Component
```typescript
interface QuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showFeedback: boolean;
  userAnswer?: string;
}

// Responsibilities:
// - Display question text clearly
// - Show multiple choice options
// - Handle user selection
// - Display feedback (correct/incorrect with explanation)
// - Highlight correct answer and user's choice
```

## 5. Data Flow Specifications

### 5.1 Quiz Taking Flow
```
1. User clicks "Start Algebra Easy Quiz" on Dashboard
   ↓
2. QuizEngine fetches 5 random easy algebra questions
   SQL: SELECT * FROM questions 
        WHERE topic_id = $1 AND difficulty_level = 1 
        ORDER BY RANDOM() LIMIT 5
   ↓
3. Display first question with options
   ↓
4. User selects answer → Show immediate feedback
   ↓
5. User clicks "Next" → Display next question
   ↓
6. After 5 questions → Calculate results
   - Score: correct_answers / total_questions
   - XP: (correct_answers * 20) + (incorrect_answers * 5)
   ↓
7. Save to database:
   INSERT INTO quiz_attempts (user_id, topic_id, total_questions, correct_answers, xp_earned)
   UPDATE profiles SET xp = xp + earned_xp WHERE id = user_id
   ↓
8. Show results page → Return to dashboard
```

### 5.2 Error Handling Flow
```
Database Error:
├── Connection Failed
│   ├── Show cached questions if available
│   ├── Save answers locally (localStorage)
│   └── Sync when connection restored
│
├── Query Timeout
│   ├── Retry 3 times with exponential backoff
│   ├── Show error message if all retries fail
│   └── Allow user to try again
│
└── Insert Failed (saving quiz attempt)
    ├── Queue for retry with user notification
    ├── Don't lose user's progress
    └── Background sync when possible

UI Error:
├── Component Crash
│   ├── Error Boundary catches error
│   ├── Show user-friendly error message
│   ├── Log error details for debugging
│   └── Provide "Reload" or "Go Home" options
│
└── Invalid Data
    ├── Use default values where possible
    ├── Show specific field errors
    └── Prevent form submission until fixed
```

## 6. API Specifications

### 6.1 Questions API
```typescript
// GET /api/questions?topic=algebra&difficulty=1&limit=5
interface GetQuestionsParams {
  topic: string;
  difficulty: number;
  limit: number;
  exclude?: string[]; // Question IDs to exclude (avoid repeats)
}

interface GetQuestionsResponse {
  questions: Question[];
  totalAvailable: number;
}
```

### 6.2 Quiz Attempts API
```typescript
// POST /api/quiz-attempts
interface SaveQuizAttemptRequest {
  topicId: string;
  difficulty: number;
  questions: string[]; // Question IDs
  answers: string[]; // User's answers
  timeTakenSeconds: number;
}

interface SaveQuizAttemptResponse {
  attemptId: string;
  score: number;
  xpEarned: number;
  newUserXP: number;
  newUserLevel: number;
}
```

## 7. Testing Strategy

### 7.1 Unit Tests
```typescript
// Component Tests
describe('Question Component', () => {
  it('renders question text correctly')
  it('shows all answer options')
  it('calls onAnswer when option selected')
  it('highlights correct answer in feedback mode')
  it('shows explanation when available')
  it('handles missing data gracefully')
})

describe('QuizEngine Component', () => {
  it('fetches questions on mount')
  it('advances to next question')
  it('calculates score correctly')
  it('saves attempt on completion')
  it('handles API errors gracefully')
})
```

### 7.2 Integration Tests
```typescript
// Full User Journey
describe('Complete Quiz Flow', () => {
  beforeEach(() => {
    // Setup test user and test questions
    cy.login('test@example.com')
    cy.seedDatabase('5-algebra-questions')
  })

  it('completes full quiz journey', () => {
    // Dashboard → Quiz Selection → Questions → Results → Dashboard
    cy.visit('/dashboard')
    cy.get('[data-testid="topic-algebra"]').click()
    cy.get('[data-testid="start-quiz"]').click()
    
    // Answer 5 questions
    for (let i = 0; i < 5; i++) {
      cy.get('[data-testid="option-a"]').click()
      cy.get('[data-testid="next-question"]').click()
    }
    
    // Verify results
    cy.get('[data-testid="quiz-score"]').should('exist')
    cy.get('[data-testid="xp-earned"]').should('exist')
    
    // Return to dashboard
    cy.get('[data-testid="return-dashboard"]').click()
    cy.url().should('include', '/dashboard')
  })
})
```

### 7.3 Database Tests
```typescript
describe('Quiz Attempt Storage', () => {
  it('saves attempt with correct data', async () => {
    const attempt = await saveQuizAttempt({
      userId: testUser.id,
      topicId: 'algebra',
      questions: ['q1', 'q2', 'q3', 'q4', 'q5'],
      answers: ['A', 'B', 'C', 'A', 'D'],
      score: 4
    })
    
    expect(attempt.score).toBe(4)
    expect(attempt.xpEarned).toBe(85) // (4*20) + (1*5)
  })
  
  it('updates user XP correctly', async () => {
    const initialXP = await getUserXP(testUser.id)
    await saveQuizAttempt(validAttempt)
    const finalXP = await getUserXP(testUser.id)
    
    expect(finalXP).toBe(initialXP + 85)
  })
})
```

## 8. Performance Requirements

### 8.1 Page Load Times
- Dashboard: < 1 second
- Quiz start: < 2 seconds  
- Question navigation: < 0.5 seconds
- Results calculation: < 1 second

### 8.2 Database Query Optimization
- Questions query with indexes on topic_id and difficulty_level
- User progress queries with composite indexes
- Pagination for large result sets

### 8.3 Caching Strategy
- Static question data cached for 1 hour
- User progress cached until modified
- Topic lists cached indefinitely (rarely change)

This specification provides the complete blueprint for implementation. Every component, API, and interaction is clearly defined with expected inputs, outputs, and error conditions.

**Next Step: Create detailed implementation plan with Test-Driven Development approach.**