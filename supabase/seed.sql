-- Insert sample subjects
INSERT INTO public.subjects (name, code, description, icon, color) VALUES
('Mathematics', 'MATH', 'IGCSE Mathematics curriculum covering algebra, geometry, statistics', 'calculator', '#3B82F6'),
('Physics', 'PHYS', 'IGCSE Physics covering mechanics, waves, electricity, and modern physics', 'atom', '#8B5CF6'),
('Chemistry', 'CHEM', 'IGCSE Chemistry covering atomic structure, bonding, and reactions', 'flask', '#06B6D4'),
('Biology', 'BIO', 'IGCSE Biology covering cells, genetics, ecology, and human biology', 'leaf', '#10B981'),
('English Language', 'ENG', 'IGCSE English Language focusing on comprehension and composition', 'book-open', '#F59E0B'),
('Computer Science', 'CS', 'IGCSE Computer Science covering programming and computational thinking', 'monitor', '#6B7280');

-- Insert sample achievements
INSERT INTO public.achievements (name, description, icon, condition_type, condition_value, xp_reward) VALUES
('First Steps', 'Complete your first quiz', 'trophy', 'questions_answered', 1, 50),
('Getting Started', 'Answer 10 questions correctly', 'target', 'correct_answers', 10, 100),
('Math Whiz', 'Score 80%+ accuracy in Mathematics', 'calculator', 'subject_accuracy', 80, 200),
('Study Streak', 'Study for 3 days in a row', 'flame', 'streak', 3, 150),
('Century Club', 'Answer 100 questions', 'hundred-points', 'questions_answered', 100, 300),
('Perfectionist', 'Get 10 questions right in a row', 'check-circle', 'consecutive_correct', 10, 250),
('Night Owl', 'Study after 10 PM', 'moon', 'late_study', 1, 75),
('Early Bird', 'Study before 7 AM', 'sunrise', 'early_study', 1, 75),
('Speed Demon', 'Answer a question in under 10 seconds', 'zap', 'fast_answer', 10, 100),
('Subject Master', 'Reach 90%+ accuracy in any subject', 'crown', 'subject_mastery', 90, 500);

-- Insert sample math questions
INSERT INTO public.questions (subject_id, question_text, options, correct_answer, explanation, difficulty_level, topic, curriculum_reference) VALUES
((SELECT id FROM public.subjects WHERE code = 'MATH'), 
 'What is the value of x in the equation 2x + 5 = 13?', 
 '["2", "3", "4", "5"]', 
 '4', 
 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4',
 2, 
 'Algebra', 
 'MATH-ALG-001'),

((SELECT id FROM public.subjects WHERE code = 'MATH'), 
 'What is the area of a circle with radius 5 cm? (Use π = 3.14)', 
 '["31.4 cm²", "62.8 cm²", "78.5 cm²", "157 cm²"]', 
 '78.5 cm²', 
 'Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5 cm²',
 3, 
 'Geometry', 
 'MATH-GEO-002'),

((SELECT id FROM public.subjects WHERE code = 'MATH'), 
 'Simplify: 3x + 2x - x', 
 '["4x", "5x", "6x", "2x"]', 
 '4x', 
 'Combine like terms: 3x + 2x - x = (3 + 2 - 1)x = 4x',
 1, 
 'Algebra', 
 'MATH-ALG-003'),

-- Insert sample physics questions
((SELECT id FROM public.subjects WHERE code = 'PHYS'), 
 'What is the unit of force in the SI system?', 
 '["Joule", "Newton", "Watt", "Pascal"]', 
 'Newton', 
 'The Newton (N) is the SI unit of force, named after Isaac Newton',
 1, 
 'Forces and Motion', 
 'PHYS-FRC-001'),

((SELECT id FROM public.subjects WHERE code = 'PHYS'), 
 'A car accelerates from rest to 20 m/s in 4 seconds. What is its acceleration?', 
 '["4 m/s²", "5 m/s²", "16 m/s²", "80 m/s²"]', 
 '5 m/s²', 
 'Acceleration = (final velocity - initial velocity) / time = (20 - 0) / 4 = 5 m/s²',
 2, 
 'Forces and Motion', 
 'PHYS-FRC-002'),

-- Insert sample chemistry questions
((SELECT id FROM public.subjects WHERE code = 'CHEM'), 
 'What is the chemical symbol for gold?', 
 '["Go", "Gd", "Au", "Ag"]', 
 'Au', 
 'Gold has the chemical symbol Au, from the Latin word "aurum"',
 1, 
 'Periodic Table', 
 'CHEM-PER-001'),

((SELECT id FROM public.subjects WHERE code = 'CHEM'), 
 'How many electrons does a neutral carbon atom have?', 
 '["4", "6", "12", "14"]', 
 '6', 
 'Carbon has atomic number 6, meaning it has 6 protons and 6 electrons in a neutral atom',
 2, 
 'Atomic Structure', 
 'CHEM-ATM-002'),

-- Insert sample biology questions
((SELECT id FROM public.subjects WHERE code = 'BIO'), 
 'What is the powerhouse of the cell?', 
 '["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"]', 
 'Mitochondria', 
 'Mitochondria produce ATP through cellular respiration, providing energy for the cell',
 1, 
 'Cell Structure', 
 'BIO-CEL-001'),

((SELECT id FROM public.subjects WHERE code = 'BIO'), 
 'Which process do plants use to make their own food?', 
 '["Respiration", "Photosynthesis", "Digestion", "Excretion"]', 
 'Photosynthesis', 
 'Photosynthesis converts light energy, carbon dioxide, and water into glucose and oxygen',
 1, 
 'Photosynthesis', 
 'BIO-PHO-001'),

-- Insert sample English questions
((SELECT id FROM public.subjects WHERE code = 'ENG'), 
 'Which of the following is a metaphor?', 
 '["The wind whispered through the trees", "Her voice is music to my ears", "The cat ran quickly", "It was raining heavily"]', 
 'Her voice is music to my ears', 
 'A metaphor directly compares two things without using "like" or "as"',
 2, 
 'Literary Devices', 
 'ENG-LIT-001'),

-- Insert sample computer science questions
((SELECT id FROM public.subjects WHERE code = 'CS'), 
 'What does CPU stand for?', 
 '["Computer Processing Unit", "Central Processing Unit", "Central Program Unit", "Computer Program Unit"]', 
 'Central Processing Unit', 
 'CPU stands for Central Processing Unit, the main component that executes instructions',
 1, 
 'Hardware', 
 'CS-HRD-001');