# Database Setup Required for Quiz History Feature

## 🚨 Action Required: Run SQL Migration

The Quiz History & Review system has been implemented but requires database schema updates.

### Step 1: Open Supabase SQL Editor
Go to: https://nkcjwrksvmjzqsatwkac.supabase.co/project/default/sql

### Step 2: Run This Complete Migration Script

```sql
-- ================================================
-- Quiz History & Review System Migration
-- ================================================

-- Step 1: Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  session_type VARCHAR(20) DEFAULT 'practice',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add RLS policies for quiz_sessions
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own quiz sessions
DROP POLICY IF EXISTS "Users can view own quiz sessions" ON quiz_sessions;
CREATE POLICY "Users can view own quiz sessions" ON quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own quiz sessions  
DROP POLICY IF EXISTS "Users can insert own quiz sessions" ON quiz_sessions;
CREATE POLICY "Users can insert own quiz sessions" ON quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own quiz sessions
DROP POLICY IF EXISTS "Users can update own quiz sessions" ON quiz_sessions;
CREATE POLICY "Users can update own quiz sessions" ON quiz_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 3: Update quiz_attempts table with session tracking
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE;

ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS question_order INTEGER;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON quiz_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_subject_id ON quiz_sessions(subject_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_id ON quiz_attempts(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question_order ON quiz_attempts(quiz_session_id, question_order);

-- Step 5: Grant permissions (if needed)
GRANT ALL ON quiz_sessions TO authenticated;

-- Step 6: Verify the setup
SELECT 'quiz_sessions' as table_name, COUNT(*) as row_count FROM quiz_sessions
UNION ALL
SELECT 'quiz_attempts' as table_name, COUNT(*) as row_count FROM quiz_attempts;

-- Step 7: Check column structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('quiz_sessions', 'quiz_attempts') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### Step 3: Expected Output
After running the migration, you should see:
```
- quiz_sessions table created with 0 rows
- quiz_attempts table updated with new columns
- All indexes created
- RLS policies enabled
```

### Step 4: Test the Setup
Run the test script after migration:
```bash
cd igcse-quiz-app
node scripts/test-quiz-history-system.js
```

## ✅ What This Enables

Once the database is updated, users will be able to:

### 1. **Quiz Sessions Tracking**
- Each quiz creates a `quiz_session` record
- Questions are grouped together as a complete quiz experience
- Track start time, completion time, total score, and accuracy

### 2. **Quiz History Page** (`/history`)
- View all completed quizzes
- See performance trends over time
- Click any quiz to review individual questions

### 3. **Individual Quiz Review** (`/history/[sessionId]`)
- See every question from that quiz
- View user's answer vs correct answer
- Read explanations for each question
- Color-coded correct/incorrect indicators

### 4. **Enhanced Analytics**
- Study streak tracking
- Accuracy trends
- Total questions answered across all sessions
- XP progression over time

## 🔧 Technical Implementation

### Database Schema
```
quiz_sessions:
- Links questions into cohesive quiz experiences
- Tracks completion stats and performance metrics
- Enables historical analysis and progress tracking

quiz_attempts (updated):
- Now linked to quiz_sessions via quiz_session_id
- Includes question_order for proper sequencing
- Maintains all existing functionality
```

### User Experience Flow
```
1. User starts quiz → creates quiz_session
2. User answers questions → records quiz_attempts with session_id
3. User completes quiz → updates quiz_session with final stats
4. User can review → /history shows all sessions
5. User clicks session → /history/[id] shows detailed review
```

## 🚨 Important Notes

- **Backward Compatibility**: Existing `quiz_attempts` records will still work
- **RLS Security**: Users can only see their own quiz sessions
- **Performance**: Indexes added for fast query performance
- **Data Integrity**: Foreign key constraints maintain data consistency

After running this migration, the Quiz History & Review system will be fully operational!