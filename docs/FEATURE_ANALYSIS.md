# IGCSE Quiz App - Feature Analysis & Development Plan

**Date**: 2025-08-10  
**Status**: Comprehensive Feature Review  

## 1. Current Implementation Status

### ✅ **What We HAVE**
1. **Core Quiz Engine**
   - Mathematics subject with 19 questions across 5 topics
   - Multiple choice question system
   - Real-time answer validation
   - XP earning system (20XP correct, 10XP participation)
   - Difficulty levels (1-3)

2. **User Authentication**
   - Supabase auth integration
   - User profiles with basic info
   - Session management

3. **Basic UI Components**
   - Dashboard showing subjects
   - Quiz interface with question navigation
   - Error boundaries for graceful failure
   - Responsive design

4. **Database Structure**
   - `profiles`, `subjects`, `questions`, `quiz_attempts`, `user_progress`
   - Row Level Security (RLS) implemented
   - Auto-deployed to Vercel

### ❌ **Critical GAPS**

## 2. Missing Core Features Analysis

### 2.1 **Quiz History & Review System** (HIGH PRIORITY)
**Current State**: User answers questions but cannot review past performance  
**User Need**: "I want to see all quizzes I've done, questions within quizzes, right/wrong answers"  

**Missing Components**:
- **Quiz Session Tracking**: No concept of "quiz sessions" - just individual question attempts
- **Historical Review Pages**: Cannot view past quizzes or performance
- **Question-Level Analysis**: Cannot see which specific questions were wrong
- **Performance Trends**: Cannot track improvement over time

**Database Gap**:
```typescript
// MISSING: Quiz Sessions table
interface QuizSession {
  id: string
  user_id: string
  subject_id: string
  started_at: string
  completed_at: string | null
  total_questions: number
  correct_answers: number
  total_xp_earned: number
  accuracy_percentage: number
  session_type: 'practice' | 'timed' | 'review'
}

// MISSING: Connection between quiz_attempts and sessions
interface QuizAttempt {
  // ... existing fields
  quiz_session_id: string  // <- MISSING
  question_order: number   // <- MISSING (order within session)
}
```

**UI Components Needed**:
- `QuizHistoryPage.tsx` - List all past quiz sessions
- `QuizReviewPage.tsx` - Detailed review of specific quiz session
- `QuestionReview.tsx` - Component to show question + user's answer + correct answer
- `PerformanceChart.tsx` - Visual progress tracking

### 2.2 **Comprehensive User Statistics** (HIGH PRIORITY)
**Current State**: Basic XP and accuracy, but no detailed analytics  
**User Need**: "I want to see my study streak, topic weaknesses, total questions answered"  

**Missing Analytics**:
- **Study Streaks**: Daily/weekly activity tracking
- **Topic-wise Breakdown**: Performance by topic (Algebra, Geometry, etc.)
- **Time-based Analytics**: Questions per day, session duration
- **Difficulty Progression**: How user improves from Level 1→2→3 questions
- **Comparative Analysis**: How user ranks relative to others

**Database Gaps**:
```typescript
// EXISTING but underutilized: UserProgress
// MISSING: Topic-specific progress tracking
interface TopicProgress {
  id: string
  user_id: string
  subject_id: string
  topic_name: string
  questions_attempted: number
  correct_answers: number
  accuracy_percentage: number
  last_practiced: string
}

// MISSING: Daily activity tracking
interface DailyActivity {
  id: string
  user_id: string
  date: string
  questions_answered: number
  xp_earned: number
  session_duration_minutes: number
  subjects_practiced: string[]
}
```

### 2.3 **Enhanced Quiz Experience** (MEDIUM PRIORITY)
**Current State**: Basic quiz flow, but missing key UX features  

**Missing Features**:
- **Question Timer**: No time pressure or time tracking per question
- **Question Skip**: Cannot skip difficult questions and return later
- **Quiz Modes**: Only "practice" mode, no timed/exam modes
- **Question Bookmarking**: Cannot save questions for later review
- **Explanations Display**: Explanations exist in DB but not shown effectively
- **Progress Within Quiz**: No "Question 3 of 15" progress indicator

### 2.4 **User Profile & Settings** (MEDIUM PRIORITY)
**Current State**: Basic profile exists but no management UI  

**Missing**:
- Profile management page
- Study preferences (timer settings, difficulty preference)
- Achievement/badge system
- Avatar/profile customization
- Account settings (change password, etc.)

### 2.5 **Content Management** (LOW PRIORITY - Future)
**Current State**: Only Mathematics, questions hardcoded  

**Missing**:
- Multiple subjects (Physics, Chemistry, Biology, etc.)
- Dynamic question loading
- Admin interface for content management
- Question difficulty auto-adjustment based on user performance

## 3. Proposed Implementation Plan

### Phase 1: **Quiz History & Review System** (Sprint 1-2, 2 weeks)

#### Sprint 1: Database & Backend (Week 1)
1. **Database Schema Updates**
   ```sql
   -- Add quiz_sessions table
   CREATE TABLE quiz_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     subject_id UUID REFERENCES subjects(id),
     started_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ,
     total_questions INTEGER,
     correct_answers INTEGER,
     total_xp_earned INTEGER,
     accuracy_percentage DECIMAL(5,2),
     session_type VARCHAR(20) DEFAULT 'practice'
   );
   
   -- Update quiz_attempts to link to sessions
   ALTER TABLE quiz_attempts ADD COLUMN quiz_session_id UUID REFERENCES quiz_sessions(id);
   ALTER TABLE quiz_attempts ADD COLUMN question_order INTEGER;
   ```

2. **Update Quiz Logic**
   - Modify `QuizInterface.tsx` to create session on start
   - Update database operations to include session tracking
   - Add session completion logic

#### Sprint 2: UI Components (Week 2)
1. **Create History Components**
   - `src/app/history/page.tsx` - Quiz history list
   - `src/app/history/[sessionId]/page.tsx` - Individual session review
   - `src/components/QuizHistory.tsx` - History list component
   - `src/components/SessionReview.tsx` - Session detail component

2. **Update Navigation**
   - Add "History" link to dashboard
   - Add "Review This Quiz" button after quiz completion

### Phase 2: **Enhanced Analytics Dashboard** (Sprint 3-4, 2 weeks)

#### Sprint 3: Data Collection (Week 3)
1. **Analytics Database Schema**
   ```sql
   CREATE TABLE topic_progress (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     subject_id UUID REFERENCES subjects(id),
     topic_name VARCHAR(100),
     questions_attempted INTEGER DEFAULT 0,
     correct_answers INTEGER DEFAULT 0,
     accuracy_percentage DECIMAL(5,2),
     last_practiced TIMESTAMPTZ
   );
   
   CREATE TABLE daily_activities (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id),
     activity_date DATE,
     questions_answered INTEGER DEFAULT 0,
     xp_earned INTEGER DEFAULT 0,
     session_duration_minutes INTEGER DEFAULT 0,
     subjects_practiced TEXT[]
   );
   ```

2. **Background Analytics Processing**
   - Create functions to calculate topic progress
   - Implement daily activity tracking
   - Add streak calculation logic

#### Sprint 4: Analytics UI (Week 4)
1. **Create Analytics Components**
   - `src/components/AnalyticsDashboard.tsx` - Main analytics view
   - `src/components/TopicBreakdown.tsx` - Performance by topic
   - `src/components/StreakTracker.tsx` - Study streak visualization
   - `src/components/PerformanceChart.tsx` - Progress over time

2. **Update Dashboard**
   - Replace basic stats with comprehensive analytics
   - Add mini-charts and progress indicators
   - Include "weak topics" recommendations

### Phase 3: **Enhanced Quiz Experience** (Sprint 5-6, 2 weeks)

#### Sprint 5: Quiz Enhancements (Week 5-6)
1. **Timer System**
   - Add configurable question timers
   - Track time per question for analytics
   - Add timer UI component

2. **Quiz Modes**
   - Practice mode (current)
   - Timed mode (exam simulation)
   - Review mode (focus on incorrect answers)

3. **Navigation Improvements**
   - Question skip functionality
   - Question bookmarking
   - Better progress indicators

## 4. Detailed Feature Specifications

### 4.1 Quiz History & Review Feature Spec

**User Story**: "As a student, I want to review all my past quizzes so I can see my progress and learn from mistakes."

**Acceptance Criteria**:
1. **Quiz History List**
   - Show all completed quiz sessions
   - Display: date, subject, score, accuracy, time taken
   - Sort by date (newest first)
   - Filter by subject or date range

2. **Session Review Page**
   - Show all questions from that session
   - Display user's answer vs correct answer
   - Show explanation for each question
   - Highlight correct/incorrect answers with color coding
   - Option to "Retry this quiz" with same questions

3. **Question-Level Detail**
   - Show exact question text and options
   - User's selected answer (highlighted)
   - Correct answer (if different, highlighted in green)
   - Explanation text
   - Time taken to answer
   - XP earned/lost

**Database Queries Needed**:
```sql
-- Get user's quiz history
SELECT 
  qs.*,
  s.name as subject_name,
  COUNT(qa.id) as total_questions,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) as correct_count
FROM quiz_sessions qs
JOIN subjects s ON qs.subject_id = s.id
LEFT JOIN quiz_attempts qa ON qs.id = qa.quiz_session_id
WHERE qs.user_id = ? AND qs.completed_at IS NOT NULL
GROUP BY qs.id, s.name
ORDER BY qs.completed_at DESC;

-- Get detailed session review
SELECT 
  qa.*,
  q.question_text,
  q.options,
  q.correct_answer,
  q.explanation,
  q.topic,
  q.difficulty_level
FROM quiz_attempts qa
JOIN questions q ON qa.question_id = q.id
WHERE qa.quiz_session_id = ?
ORDER BY qa.question_order;
```

### 4.2 Analytics Dashboard Feature Spec

**User Story**: "As a student, I want to see detailed analytics about my learning progress so I can identify areas to focus on."

**Key Metrics to Display**:
1. **Overall Performance**
   - Total questions answered (all-time)
   - Current accuracy rate
   - Total XP earned
   - Current level
   - Study streak (days)

2. **Topic Performance**
   - Accuracy by topic (Algebra: 85%, Geometry: 67%, etc.)
   - Questions answered per topic
   - Recommended focus areas (lowest accuracy topics)

3. **Progress Over Time**
   - Daily/weekly questions answered
   - Accuracy trend over last 30 days
   - XP earned per day
   - Session duration trends

4. **Difficulty Analysis**
   - Performance by difficulty level
   - Progression tracking (when user "levels up" in difficulty)

**UI Layout**:
```
┌─ Analytics Dashboard ─────────────────────────────┐
│                                                   │
│ ┌─ Overview Cards ─┐  ┌─ Study Streak ─┐         │
│ │ 2,547 Questions  │  │ 🔥 12 Day      │         │
│ │ 78% Accuracy     │  │ Streak!        │         │
│ │ 15,230 XP        │  │                │         │
│ │ Level 8          │  └────────────────┘         │
│ └──────────────────┘                             │
│                                                   │
│ ┌─ Topic Breakdown ──────────────────────┐       │
│ │ Algebra        ████████░░ 85% (234 Q)  │       │
│ │ Geometry       ██████░░░░ 67% (189 Q)  │       │
│ │ Statistics     ███████░░░ 73% (156 Q)  │       │
│ │ Probability    █████░░░░░ 52% (98 Q)   │ ⚠️    │
│ └────────────────────────────────────────┘       │
│                                                   │
│ ┌─ Progress Chart (Last 30 Days) ────────┐       │
│ │     ╭─╮              ╭─╮               │       │
│ │   ╭─╯ ╰─╮          ╭─╯ ╰─╮             │       │
│ │ ╭─╯     ╰──────╮╭──╯     ╰─╮           │       │
│ │╭╯            ╰─╯         ╰──╮        │       │
│ └────────────────────────────────────────┘       │
│                                                   │
│ ┌─ Recommendations ──────────────────────┐       │
│ │ 💡 Focus on Probability (52% accuracy)  │       │
│ │ 🎯 Try Level 2 Geometry questions       │       │
│ │ 📚 Review incorrect Algebra questions   │       │
│ └────────────────────────────────────────┘       │
└───────────────────────────────────────────────────┘
```

## 5. Technical Implementation Notes

### 5.1 Database Migration Strategy
```sql
-- Migration 001: Add quiz sessions
-- Migration 002: Add analytics tables  
-- Migration 003: Update existing quiz_attempts
-- Migration 004: Create indexes for performance
```

### 5.2 Component Architecture
```
src/
├── components/
│   ├── quiz/
│   │   ├── QuizInterface.tsx (existing)
│   │   ├── QuizHistory.tsx (new)
│   │   ├── SessionReview.tsx (new)
│   │   └── QuizTimer.tsx (new)
│   ├── analytics/
│   │   ├── AnalyticsDashboard.tsx (new)
│   │   ├── TopicBreakdown.tsx (new)
│   │   ├── ProgressChart.tsx (new)
│   │   └── StreakTracker.tsx (new)
│   └── common/
│       ├── LoadingSpinner.tsx (new)
│       └── StatsCard.tsx (new)
├── app/
│   ├── history/
│   │   ├── page.tsx (new)
│   │   └── [sessionId]/page.tsx (new)
│   ├── analytics/
│   │   └── page.tsx (new)
│   └── quiz/[subjectId]/
│       └── page.tsx (existing - enhance)
└── lib/
    ├── analytics.ts (new)
    ├── quiz-sessions.ts (new)
    └── database-migrations.ts (new)
```

### 5.3 Performance Considerations
- Use React.memo for heavy components
- Implement virtual scrolling for long quiz histories
- Cache analytics data with appropriate TTL
- Optimize database queries with proper indexes

## 6. Next Steps & Decision Points

### Immediate Actions Needed:
1. **Validate Feature Priority** - Which features are most important to you?
2. **Design Database Migrations** - Plan the schema changes carefully
3. **Create UI Mockups** - Design the analytics dashboard layout
4. **Set Development Timeline** - Realistic sprint planning

### Questions for Product Owner:
1. Do you want to implement Phase 1 (Quiz History) first, or would you prefer starting with analytics?
2. What specific analytics are most important? (topic breakdown, streaks, etc.)
3. Should we add more subjects before building advanced features?
4. Do you want timer-based quizzes or focus on practice mode?

**Current Priority Recommendation**: Start with **Quiz History & Review** as it directly addresses your stated need and provides immediate value to users who want to track their learning progress.