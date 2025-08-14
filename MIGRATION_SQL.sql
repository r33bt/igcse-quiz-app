
-- EXACT SQL TO RUN IN SUPABASE SQL EDITOR
-- Copy and paste this into https://nkcjwrksvmjzqsatwkac.supabase.co/project/default/sql

BEGIN;

-- Add missing columns to quiz_attempts
ALTER TABLE public.quiz_attempts ADD COLUMN quiz_session_id UUID;
ALTER TABLE public.quiz_attempts ADD COLUMN question_order INTEGER;

-- Add foreign key constraint
ALTER TABLE public.quiz_attempts 
ADD CONSTRAINT fk_quiz_session 
FOREIGN KEY (quiz_session_id) REFERENCES public.quiz_sessions(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_quiz_attempts_session_id ON public.quiz_attempts(quiz_session_id);
CREATE INDEX idx_quiz_attempts_question_order ON public.quiz_attempts(quiz_session_id, question_order);

-- Verify columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' 
  AND table_schema = 'public'
  AND column_name IN ('quiz_session_id', 'question_order')
ORDER BY column_name;

COMMIT;
