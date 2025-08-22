-- Database Migration Verification Script
-- Run this in Supabase SQL Editor to check everything is working

-- 1. Check if all tables were created
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('igcse_topics', 'igcse_subtopics', 'user_subtopic_progress') 
    THEN '✅ New Table'
    ELSE '📋 Existing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('igcse_topics', 'igcse_subtopics', 'user_subtopic_progress', 'questions', 'profiles')
ORDER BY table_name;

-- 2. Check topics were inserted
SELECT 
  '📊 Topics Count' as check_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 9 THEN '✅ Success' ELSE '❌ Missing' END as status
FROM igcse_topics;

-- 3. Show all topics with their colors
SELECT 
  code,
  name,
  color,
  order_index
FROM igcse_topics 
ORDER BY order_index;

-- 4. Check subtopics were inserted  
SELECT 
  '📚 Subtopics Count' as check_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 40 THEN '✅ Success' ELSE '❌ Missing' END as status
FROM igcse_subtopics;

-- 5. Show subtopics per topic
SELECT 
  t.name as topic_name,
  COUNT(s.id) as subtopic_count
FROM igcse_topics t
LEFT JOIN igcse_subtopics s ON t.id = s.topic_id
GROUP BY t.id, t.name, t.order_index
ORDER BY t.order_index;

-- 6. Check questions table was enhanced
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('igcse_topic_id', 'igcse_subtopic_id', 'paper_type', 'difficulty_label') 
    THEN '✅ New Column'
    ELSE '📋 Existing'
  END as status
FROM information_schema.columns 
WHERE table_name = 'questions' 
  AND column_name IN ('igcse_topic_id', 'igcse_subtopic_id', 'paper_type', 'difficulty_label', 'question_text', 'options')
ORDER BY column_name;

-- 7. Check RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  '✅ Policy Active' as status
FROM pg_policies 
WHERE tablename IN ('igcse_topics', 'igcse_subtopics', 'user_subtopic_progress')
ORDER BY tablename, policyname;

-- 8. Test a sample query that the app will use
SELECT 
  t.code,
  t.name,
  t.color,
  COUNT(s.id) as subtopic_count
FROM igcse_topics t
LEFT JOIN igcse_subtopics s ON t.id = s.topic_id AND s.paper_type = 'Core'
GROUP BY t.id, t.code, t.name, t.color, t.order_index
ORDER BY t.order_index
LIMIT 3;
