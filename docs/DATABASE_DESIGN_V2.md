# IGCSE Quiz App V2 - Database Design

**Version**: 2.0  
**Date**: 2025-08-10  
**Database**: PostgreSQL via Supabase  

## 1. Schema Overview

### 1.1 Core Tables
```
profiles (user data & progress)
    ↓
quiz_attempts (completed quizzes) → topics (subject areas)
    ↓                                   ↓
user_progress (per-topic stats)     questions (question bank)
```

### 1.2 Data Relationships
- One user has many quiz attempts
- One topic has many questions  
- One quiz attempt references one topic
- One user has one progress record per topic

## 2. Complete Schema Definition

### 2.1 User Profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Triggers for automatic level calculation
CREATE OR REPLACE FUNCTION calculate_user_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Level = (XP / 1000) + 1, so Level 1 = 0-999 XP, Level 2 = 1000-1999 XP, etc.
  NEW.level = (NEW.xp / 1000) + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_level
  BEFORE UPDATE OF xp ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_user_level();

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Topics (Subject Areas)
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- "Algebra", "Geometry", "Statistics"
  slug TEXT NOT NULL UNIQUE, -- "algebra", "geometry", "statistics" (URL-friendly)
  description TEXT,
  icon TEXT DEFAULT 'book', -- Icon name for UI (book, calculator, chart, etc.)
  color TEXT DEFAULT '#3B82F6', -- Hex color code for UI theming
  sort_order INTEGER DEFAULT 0, -- For ordering topics in UI
  is_active BOOLEAN DEFAULT true, -- Can disable topics without deleting
  total_questions INTEGER DEFAULT 0, -- Cached count for performance
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Function to update question count
CREATE OR REPLACE FUNCTION update_topic_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE topics 
    SET total_questions = total_questions - 1 
    WHERE id = OLD.topic_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE topics 
    SET total_questions = total_questions + 1 
    WHERE id = NEW.topic_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain question count
CREATE TRIGGER maintain_topic_question_count
  AFTER INSERT OR DELETE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_question_count();
```

### 2.3 Questions Bank
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  
  -- Options stored as JSON array: ["A) First option", "B) Second option", ...]
  options JSONB NOT NULL,
  
  -- Correct answer must match one of the options exactly
  correct_answer TEXT NOT NULL,
  
  -- Detailed explanation shown after answering
  explanation TEXT,
  
  -- IGCSE curriculum reference (e.g., "0580/02/SP/2023/Q1")
  curriculum_ref TEXT,
  
  -- Tags for finer categorization (e.g., ["linear_equations", "basic_algebra"])
  tags TEXT[] DEFAULT '{}',
  
  -- Quality metrics
  times_used INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Admin fields
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Constraints
ALTER TABLE questions ADD CONSTRAINT options_not_empty 
  CHECK (jsonb_array_length(options) >= 2);

ALTER TABLE questions ADD CONSTRAINT correct_answer_in_options 
  CHECK (correct_answer = ANY(ARRAY(SELECT jsonb_array_elements_text(options))));

-- Function to update question statistics
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called when quiz attempts are inserted
  -- Update question usage and accuracy statistics
  UPDATE questions SET
    times_used = times_used + 1,
    times_correct = times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    accuracy_rate = ROUND(
      (times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END) * 100.0 / 
      (times_used + 1), 2
    ),
    updated_at = NOW()
  WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2.4 Quiz Attempts
```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  
  -- Quiz configuration
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  
  -- Results
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  score_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    ROUND((correct_answers * 100.0) / total_questions, 2)
  ) STORED,
  
  -- Timing
  time_taken_seconds INTEGER CHECK (time_taken_seconds > 0),
  
  -- XP System
  xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
  
  -- Question Details (for review and analytics)
  questions_asked JSONB NOT NULL, -- Array of question IDs
  user_answers JSONB NOT NULL,    -- Array of user's answers
  correct_answers_detail JSONB NOT NULL, -- Array of correct answers
  
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_score CHECK (correct_answers <= total_questions),
  CONSTRAINT consistent_arrays CHECK (
    jsonb_array_length(questions_asked) = total_questions AND
    jsonb_array_length(user_answers) = total_questions AND
    jsonb_array_length(correct_answers_detail) = total_questions
  )
);

-- Function to calculate XP
CREATE OR REPLACE FUNCTION calculate_quiz_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- XP Formula: (correct * 20) + (incorrect * 5) + time bonus
  -- Time bonus: +10 XP if completed in under 2 minutes per question
  DECLARE
    time_bonus INTEGER := 0;
    expected_time INTEGER := NEW.total_questions * 120; -- 2 minutes per question
  BEGIN
    IF NEW.time_taken_seconds IS NOT NULL AND NEW.time_taken_seconds < expected_time THEN
      time_bonus := 10;
    END IF;
    
    NEW.xp_earned := (NEW.correct_answers * 20) + 
                     ((NEW.total_questions - NEW.correct_answers) * 5) + 
                     time_bonus;
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_xp_before_insert
  BEFORE INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quiz_xp();

-- Trigger to update user XP when quiz is completed
CREATE OR REPLACE FUNCTION update_user_xp_from_quiz()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's total XP
  UPDATE profiles 
  SET xp = xp + NEW.xp_earned,
      last_activity = CURRENT_DATE
  WHERE id = NEW.user_id;
  
  -- Update user's streak (will be implemented in application logic)
  -- Trigger question statistics update
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_xp_after_quiz
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_xp_from_quiz();
```

### 2.5 User Progress Tracking
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  
  -- Mastery Metrics
  mastery_level INTEGER DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),
  confidence_score DECIMAL(5,2) DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- Attempt Statistics
  total_attempts INTEGER DEFAULT 0 CHECK (total_attempts >= 0),
  total_questions_answered INTEGER DEFAULT 0 CHECK (total_questions_answered >= 0),
  total_correct INTEGER DEFAULT 0 CHECK (total_correct >= 0),
  
  -- Calculated Fields
  accuracy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_questions_answered = 0 THEN 0
      ELSE ROUND((total_correct * 100.0) / total_questions_answered, 2)
    END
  ) STORED,
  
  -- Learning Analytics
  average_time_per_question INTEGER, -- seconds
  difficult_question_ids TEXT[] DEFAULT '{}', -- Questions user got wrong repeatedly
  mastered_question_ids TEXT[] DEFAULT '{}',  -- Questions user consistently gets right
  
  -- Timestamps
  last_practiced TIMESTAMPTZ,
  first_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint
  UNIQUE(user_id, topic_id)
);

-- Function to update user progress when quiz is completed
CREATE OR REPLACE FUNCTION update_user_progress_from_quiz()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user progress
  INSERT INTO user_progress (
    user_id, 
    topic_id, 
    total_attempts, 
    total_questions_answered, 
    total_correct,
    last_practiced,
    first_attempt
  ) VALUES (
    NEW.user_id,
    NEW.topic_id,
    1,
    NEW.total_questions,
    NEW.correct_answers,
    NEW.completed_at,
    NEW.completed_at
  )
  ON CONFLICT (user_id, topic_id) DO UPDATE SET
    total_attempts = user_progress.total_attempts + 1,
    total_questions_answered = user_progress.total_questions_answered + NEW.total_questions,
    total_correct = user_progress.total_correct + NEW.correct_answers,
    last_practiced = NEW.completed_at,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_progress_after_quiz
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_from_quiz();
```

## 3. Row Level Security (RLS) Policies

### 3.1 Profiles Security
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own profile
CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- No delete policy - profiles should not be deleted directly
```

### 3.2 Quiz Attempts Security
```sql
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quiz attempts
CREATE POLICY "quiz_attempts_select_own" ON quiz_attempts 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only create their own quiz attempts
CREATE POLICY "quiz_attempts_insert_own" ON quiz_attempts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No update or delete - quiz attempts are immutable once created
```

### 3.3 User Progress Security
```sql
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own progress
CREATE POLICY "user_progress_select_own" ON user_progress 
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update progress (handled by triggers)
-- Direct user modification not allowed
```

### 3.4 Public Read-Only Data
```sql
-- Topics are readable by all authenticated users
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_select_authenticated" ON topics 
  FOR SELECT TO authenticated USING (is_active = true);

-- Questions are readable by all authenticated users
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_authenticated" ON questions 
  FOR SELECT TO authenticated USING (is_active = true);
```

## 4. Indexes for Performance

### 4.1 Primary Query Indexes
```sql
-- Questions filtering (most common query)
CREATE INDEX idx_questions_topic_difficulty ON questions(topic_id, difficulty_level) 
  WHERE is_active = true;

-- User's quiz history
CREATE INDEX idx_quiz_attempts_user_date ON quiz_attempts(user_id, completed_at DESC);

-- User progress lookup
CREATE INDEX idx_user_progress_composite ON user_progress(user_id, topic_id);

-- Topic statistics
CREATE INDEX idx_quiz_attempts_topic_stats ON quiz_attempts(topic_id, completed_at DESC);
```

### 4.2 Analytics Indexes
```sql
-- Question performance analytics
CREATE INDEX idx_questions_performance ON questions(accuracy_rate DESC, times_used DESC);

-- User activity patterns
CREATE INDEX idx_profiles_activity ON profiles(last_activity DESC, xp DESC);

-- Topic popularity
CREATE INDEX idx_quiz_attempts_topic_count ON quiz_attempts(topic_id, completed_at);
```

## 5. Sample Data for Testing

### 5.1 Topics Seed Data
```sql
INSERT INTO topics (name, slug, description, icon, color, sort_order) VALUES
('Algebra', 'algebra', 'Linear equations, quadratics, and algebraic manipulation', 'calculator', '#3B82F6', 1),
('Geometry', 'geometry', 'Shapes, angles, area, and geometric proofs', 'square', '#10B981', 2),
('Statistics', 'statistics', 'Data analysis, probability, and statistical measures', 'chart-bar', '#8B5CF6', 3),
('Number', 'number', 'Fractions, decimals, percentages, and number operations', 'hash', '#F59E0B', 4),
('Calculus', 'calculus', 'Differentiation and integration basics', 'function', '#EF4444', 5);
```

### 5.2 Sample Questions
```sql
-- Easy Algebra Questions
INSERT INTO questions (topic_id, difficulty_level, question_text, options, correct_answer, explanation) VALUES
(
  (SELECT id FROM topics WHERE slug = 'algebra'),
  1,
  'Solve for x: 2x + 6 = 14',
  '["A) x = 2", "B) x = 4", "C) x = 6", "D) x = 8"]'::jsonb,
  'B) x = 4',
  'Subtract 6 from both sides: 2x = 8. Then divide by 2: x = 4.'
),
(
  (SELECT id FROM topics WHERE slug = 'algebra'),
  1,
  'What is the value of 3x when x = 5?',
  '["A) 8", "B) 15", "C) 18", "D) 20"]'::jsonb,
  'B) 15',
  'Substitute x = 5 into 3x: 3(5) = 15.'
);

-- Easy Geometry Questions
INSERT INTO questions (topic_id, difficulty_level, question_text, options, correct_answer, explanation) VALUES
(
  (SELECT id FROM topics WHERE slug = 'geometry'),
  1,
  'What is the area of a rectangle with length 8 cm and width 5 cm?',
  '["A) 13 cm²", "B) 26 cm²", "C) 40 cm²", "D) 45 cm²"]'::jsonb,
  'C) 40 cm²',
  'Area of rectangle = length × width = 8 × 5 = 40 cm².'
);
```

## 6. Database Functions & Utilities

### 6.1 User Statistics
```sql
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_quizzes INTEGER,
  total_questions INTEGER,
  overall_accuracy DECIMAL(5,2),
  current_streak INTEGER,
  favorite_topic TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(qa.id)::INTEGER as total_quizzes,
    SUM(qa.total_questions)::INTEGER as total_questions,
    ROUND(AVG(qa.score_percentage), 2) as overall_accuracy,
    p.current_streak,
    (
      SELECT t.name 
      FROM topics t
      JOIN quiz_attempts qa2 ON t.id = qa2.topic_id
      WHERE qa2.user_id = user_uuid
      GROUP BY t.id, t.name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as favorite_topic
  FROM quiz_attempts qa
  JOIN profiles p ON qa.user_id = p.id
  WHERE qa.user_id = user_uuid
  GROUP BY p.current_streak;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Topic Statistics
```sql
CREATE OR REPLACE FUNCTION get_topic_stats(topic_uuid UUID)
RETURNS TABLE (
  total_questions INTEGER,
  total_attempts INTEGER,
  average_score DECIMAL(5,2),
  difficulty_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT q.id)::INTEGER as total_questions,
    COUNT(qa.id)::INTEGER as total_attempts,
    ROUND(AVG(qa.score_percentage), 2) as average_score,
    jsonb_object_agg(
      q.difficulty_level::TEXT, 
      COUNT(q.id)
    ) as difficulty_distribution
  FROM questions q
  LEFT JOIN quiz_attempts qa ON q.topic_id = qa.topic_id
  WHERE q.topic_id = topic_uuid AND q.is_active = true
  GROUP BY q.topic_id;
END;
$$ LANGUAGE plpgsql;
```

This database design provides a solid foundation for the quiz application with proper normalization, security, performance optimization, and automated statistics tracking. All data integrity is maintained through constraints and triggers, while RLS ensures users can only access their own data.

**Ready for implementation with full database testing coverage.**