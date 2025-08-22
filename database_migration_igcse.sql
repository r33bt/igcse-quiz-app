-- IGCSE 0580 Database Schema Migration
-- This script adds proper IGCSE topic structure to support the syllabus

-- 1. Create IGCSE Topics table
CREATE TABLE IF NOT EXISTS igcse_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, -- "1", "2", "3", etc.
  name text NOT NULL, -- "Number", "Algebra and graphs"
  description text,
  color text NOT NULL, -- "#3B82F6"
  total_subtopics integer DEFAULT 0,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create IGCSE Subtopics table  
CREATE TABLE IF NOT EXISTS igcse_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES igcse_topics(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE, -- "C1.1", "E2.5"
  title text NOT NULL, -- "Types of number"
  paper_type text NOT NULL CHECK (paper_type IN ('Core', 'Extended')),
  notes_and_examples text, -- Full syllabus description
  learning_objectives text[], -- Array of specific objectives
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Enhance existing questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS igcse_topic_id uuid REFERENCES igcse_topics(id),
ADD COLUMN IF NOT EXISTS igcse_subtopic_id uuid REFERENCES igcse_subtopics(id),
ADD COLUMN IF NOT EXISTS paper_type text CHECK (paper_type IN ('Core', 'Extended', 'Both')),
ADD COLUMN IF NOT EXISTS difficulty_label text CHECK (difficulty_label IN ('Easy', 'Medium', 'Hard')),
ADD COLUMN IF NOT EXISTS curriculum_reference text,
ADD COLUMN IF NOT EXISTS exam_style text CHECK (exam_style IN ('Multiple Choice', 'Short Answer', 'Long Answer'));

-- 4. Create user progress tracking per subtopic
CREATE TABLE IF NOT EXISTS user_subtopic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subtopic_id uuid NOT NULL REFERENCES igcse_subtopics(id) ON DELETE CASCADE,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  accuracy_percentage numeric(5,2) DEFAULT 0,
  last_practiced timestamp with time zone,
  mastery_level text CHECK (mastery_level IN ('Beginner', 'Developing', 'Secure', 'Mastered')) DEFAULT 'Beginner',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, subtopic_id)
);

-- 5. Insert Core Topics data
INSERT INTO igcse_topics (code, name, description, color, order_index) VALUES
('1', 'Number', 'Natural numbers, integers, fractions, decimals, percentages, ratio, proportion', '#3B82F6', 1),
('2', 'Algebra and graphs', 'Algebraic manipulation, equations, inequalities, sequences, graphs', '#10B981', 2),
('3', 'Coordinate geometry', 'Cartesian coordinates, linear graphs, gradients, parallel lines', '#F59E0B', 3),
('4', 'Geometry', 'Geometrical terms, constructions, scale drawings, similarity, angles', '#EF4444', 4),
('5', 'Mensuration', 'Units, area, perimeter, volume, surface area, compound shapes', '#8B5CF6', 5),
('6', 'Trigonometry', 'Pythagoras theorem, sine, cosine, tangent, right-angled triangles', '#06B6D4', 6),
('7', 'Transformations and vectors', 'Reflection, rotation, enlargement, translation, vectors', '#84CC16', 7),
('8', 'Probability', 'Probability scale, single events, combined events, tree diagrams', '#EC4899', 8),
('9', 'Statistics', 'Data classification, averages, range, charts, diagrams, correlation', '#F97316', 9)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index;

-- 6. Enable Row Level Security
ALTER TABLE igcse_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE igcse_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subtopic_progress ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Topics are viewable by everyone" ON igcse_topics FOR SELECT USING (true);
CREATE POLICY "Subtopics are viewable by everyone" ON igcse_subtopics FOR SELECT USING (true);
CREATE POLICY "Users can view their own progress" ON user_subtopic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_subtopic_progress FOR ALL USING (auth.uid() = user_id);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON igcse_subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_igcse_topic ON questions(igcse_topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_igcse_subtopic ON questions(igcse_subtopic_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_subtopic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_subtopic_id ON user_subtopic_progress(subtopic_id);
