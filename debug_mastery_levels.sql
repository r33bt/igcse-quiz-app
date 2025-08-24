-- Check what mastery levels are actually stored
SELECT 
  subtopic_id,
  current_mastery_level,
  mastery_percentage,
  questions_attempted,
  questions_correct,
  easy_questions_attempted,
  easy_questions_correct,
  medium_questions_attempted,
  medium_questions_correct,
  hard_questions_attempted,
  hard_questions_correct
FROM user_subtopic_progress 
WHERE user_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  AND questions_attempted > 0
ORDER BY questions_attempted DESC;
