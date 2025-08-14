require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class MathematicsExpansionStrategy {
  constructor() {
    this.targetQuestionCount = 100;
    this.currentQuestionCount = 0;
    this.mathSubjectId = null;
  }

  async analyzeCurrentState() {
    console.log('📊 MATHEMATICS CONTENT ANALYSIS');
    console.log('=' .repeat(50));
    
    // Get Mathematics subject ID
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('name', 'Mathematics');
      
    if (!subjects || subjects.length === 0) {
      throw new Error('Mathematics subject not found in database');
    }
    
    this.mathSubjectId = subjects[0].id;
    console.log(`✅ Mathematics Subject ID: ${this.mathSubjectId}`);
    
    // Analyze current questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('subject_id', this.mathSubjectId);
      
    this.currentQuestionCount = questions?.length || 0;
    console.log(`📝 Current Questions: ${this.currentQuestionCount}`);
    console.log(`🎯 Target Questions: ${this.targetQuestionCount}`);
    console.log(`📈 Gap: ${this.targetQuestionCount - this.currentQuestionCount} questions needed`);
    
    // Analyze by topic and difficulty
    const analysis = this.analyzeDistribution(questions || []);
    this.printAnalysis(analysis);
    
    return {
      currentCount: this.currentQuestionCount,
      targetCount: this.targetQuestionCount,
      gap: this.targetQuestionCount - this.currentQuestionCount,
      analysis: analysis
    };
  }

  analyzeDistribution(questions) {
    const byTopic = {};
    const byDifficulty = { 1: 0, 2: 0, 3: 0 };
    
    questions.forEach(q => {
      // By topic
      const topic = q.topic || 'Unknown';
      byTopic[topic] = (byTopic[topic] || 0) + 1;
      
      // By difficulty
      const diff = q.difficulty || 1;
      byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
    });
    
    return { byTopic, byDifficulty };
  }

  printAnalysis(analysis) {
    console.log('\n📋 CURRENT DISTRIBUTION:');
    console.log('-'.repeat(30));
    
    console.log('By Topic:');
    Object.entries(analysis.byTopic).forEach(([topic, count]) => {
      const percentage = ((count / this.currentQuestionCount) * 100).toFixed(1);
      console.log(`   ${topic}: ${count} questions (${percentage}%)`);
    });
    
    console.log('\nBy Difficulty:');
    Object.entries(analysis.byDifficulty).forEach(([level, count]) => {
      const percentage = ((count / this.currentQuestionCount) * 100).toFixed(1);
      const diffName = { '1': 'Easy', '2': 'Medium', '3': 'Hard' }[level];
      console.log(`   Level ${level} (${diffName}): ${count} questions (${percentage}%)`);
    });
  }

  generateExpansionPlan() {
    console.log('\n🎯 EXPANSION STRATEGY');
    console.log('=' .repeat(50));
    
    // Target distribution for 100 questions
    const targetDistribution = {
      topics: {
        'Algebra': 25,           // Linear equations, quadratics, expressions
        'Geometry': 20,          // Area, volume, angles, shapes
        'Number': 20,            // Fractions, decimals, percentages
        'Statistics': 15,        // Data analysis, probability
        'Trigonometry': 12,      // Basic trig, ratios
        'Graphs': 8              // Coordinate geometry, functions
      },
      difficulty: {
        1: 40,  // 40% Easy (Foundation level)
        2: 45,  // 45% Medium (Standard level)
        3: 15   // 15% Hard (Advanced level)
      }
    };

    console.log('🎯 TARGET DISTRIBUTION (100 questions):');
    console.log('\nBy Topic:');
    Object.entries(targetDistribution.topics).forEach(([topic, count]) => {
      console.log(`   ${topic}: ${count} questions (${count}%)`);
    });
    
    console.log('\nBy Difficulty:');
    Object.entries(targetDistribution.difficulty).forEach(([level, count]) => {
      const diffName = { '1': 'Easy', '2': 'Medium', '3': 'Hard' }[level];
      console.log(`   Level ${level} (${diffName}): ${count} questions (${count}%)`);
    });

    return targetDistribution;
  }

  generateSampleQuestions() {
    console.log('\n📝 SAMPLE QUESTIONS FOR EACH CATEGORY');
    console.log('=' .repeat(50));
    
    const sampleQuestions = {
      algebra: [
        {
          difficulty: 1,
          question_text: "Solve for x: 3x + 7 = 22",
          options: ["A) x = 4", "B) x = 5", "C) x = 6", "D) x = 7"],
          correct_answer: "B) x = 5",
          explanation: "Subtract 7 from both sides: 3x = 15. Then divide by 3: x = 5.",
          topic: "Algebra"
        },
        {
          difficulty: 2,
          question_text: "Expand and simplify: (x + 3)(x - 2)",
          options: ["A) x² + x - 6", "B) x² - x + 6", "C) x² + x + 6", "D) x² - x - 6"],
          correct_answer: "A) x² + x - 6",
          explanation: "Use FOIL: x² - 2x + 3x - 6 = x² + x - 6.",
          topic: "Algebra"
        }
      ],
      geometry: [
        {
          difficulty: 1,
          question_text: "What is the area of a circle with radius 4 cm? (Use π = 3.14)",
          options: ["A) 25.12 cm²", "B) 50.24 cm²", "C) 12.56 cm²", "D) 100.48 cm²"],
          correct_answer: "B) 50.24 cm²",
          explanation: "Area = πr² = 3.14 × 4² = 3.14 × 16 = 50.24 cm².",
          topic: "Geometry"
        }
      ],
      number: [
        {
          difficulty: 1,
          question_text: "Convert 3/4 to a percentage",
          options: ["A) 34%", "B) 43%", "C) 75%", "D) 25%"],
          correct_answer: "C) 75%",
          explanation: "3/4 = 0.75 = 75%",
          topic: "Number"
        }
      ],
      statistics: [
        {
          difficulty: 1,
          question_text: "Find the mean of: 4, 7, 9, 12, 8",
          options: ["A) 7", "B) 8", "C) 9", "D) 10"],
          correct_answer: "B) 8",
          explanation: "Mean = (4 + 7 + 9 + 12 + 8) ÷ 5 = 40 ÷ 5 = 8",
          topic: "Statistics"
        }
      ]
    };

    Object.entries(sampleQuestions).forEach(([topic, questions]) => {
      console.log(`\n${topic.toUpperCase()} SAMPLES:`);
      questions.forEach((q, index) => {
        console.log(`\n${index + 1}. ${q.question_text}`);
        console.log(`   Options: ${q.options.join(', ')}`);
        console.log(`   Answer: ${q.correct_answer}`);
        console.log(`   Level: ${q.difficulty} | Topic: ${q.topic}`);
      });
    });

    return sampleQuestions;
  }

  async addSampleQuestions() {
    console.log('\n🔄 ADDING SAMPLE QUESTIONS TO DATABASE');
    console.log('=' .repeat(50));
    
    if (!this.mathSubjectId) {
      throw new Error('Mathematics subject ID not found. Run analyzeCurrentState() first.');
    }

    // Sample questions to add immediately
    const questionsToAdd = [
      // Easy Algebra
      {
        subject_id: this.mathSubjectId,
        difficulty: 1,
        question_text: "Solve for x: 3x + 7 = 22",
        options: ["A) x = 4", "B) x = 5", "C) x = 6", "D) x = 7"],
        correct_answer: "B) x = 5",
        explanation: "Subtract 7 from both sides: 3x = 15. Then divide by 3: x = 5.",
        topic: "Algebra"
      },
      {
        subject_id: this.mathSubjectId,
        difficulty: 1,
        question_text: "What is the value of 5x when x = 3?",
        options: ["A) 8", "B) 15", "C) 18", "D) 20"],
        correct_answer: "B) 15",
        explanation: "Substitute x = 3 into 5x: 5(3) = 15.",
        topic: "Algebra"
      },
      // Easy Geometry
      {
        subject_id: this.mathSubjectId,
        difficulty: 1,
        question_text: "What is the perimeter of a rectangle with length 8 cm and width 5 cm?",
        options: ["A) 13 cm", "B) 18 cm", "C) 26 cm", "D) 40 cm"],
        correct_answer: "C) 26 cm",
        explanation: "Perimeter = 2(length + width) = 2(8 + 5) = 2(13) = 26 cm.",
        topic: "Geometry"
      },
      {
        subject_id: this.mathSubjectId,
        difficulty: 1,
        question_text: "What is the area of a triangle with base 6 cm and height 4 cm?",
        options: ["A) 10 cm²", "B) 12 cm²", "C) 20 cm²", "D) 24 cm²"],
        correct_answer: "B) 12 cm²",
        explanation: "Area of triangle = ½ × base × height = ½ × 6 × 4 = 12 cm².",
        topic: "Geometry"
      },
      // Easy Number
      {
        subject_id: this.mathSubjectId,
        difficulty: 1,
        question_text: "Convert 1/2 to a decimal",
        options: ["A) 0.2", "B) 0.5", "C) 0.25", "D) 0.75"],
        correct_answer: "B) 0.5",
        explanation: "1 ÷ 2 = 0.5",
        topic: "Number"
      },
      {
        subject_id: this.mathSubjectId,
        difficulty: 1,
        question_text: "What is 25% of 80?",
        options: ["A) 15", "B) 20", "C) 25", "D) 30"],
        correct_answer: "B) 20",
        explanation: "25% of 80 = 0.25 × 80 = 20",
        topic: "Number"
      },
      // Medium Algebra
      {
        subject_id: this.mathSubjectId,
        difficulty: 2,
        question_text: "Expand: (x + 4)(x + 2)",
        options: ["A) x² + 6x + 8", "B) x² + 6x + 6", "C) x² + 8x + 6", "D) x² + 2x + 8"],
        correct_answer: "A) x² + 6x + 8",
        explanation: "Using FOIL: x² + 2x + 4x + 8 = x² + 6x + 8",
        topic: "Algebra"
      },
      {
        subject_id: this.mathSubjectId,
        difficulty: 2,
        question_text: "Solve: 2(x - 3) = 10",
        options: ["A) x = 5", "B) x = 7", "C) x = 8", "D) x = 11"],
        correct_answer: "C) x = 8",
        explanation: "2(x - 3) = 10 → 2x - 6 = 10 → 2x = 16 → x = 8",
        topic: "Algebra"
      },
      // Statistics
      {
        subject_id: this.mathSubjectId,
        difficulty: 1,
        question_text: "Find the median of: 3, 7, 5, 9, 6",
        options: ["A) 5", "B) 6", "C) 7", "D) 9"],
        correct_answer: "B) 6",
        explanation: "First arrange in order: 3, 5, 6, 7, 9. The middle value is 6.",
        topic: "Statistics"
      },
      {
        subject_id: this.mathSubjectId,
        difficulty: 2,
        question_text: "A bag contains 3 red balls and 7 blue balls. What is the probability of drawing a red ball?",
        options: ["A) 3/10", "B) 7/10", "C) 3/7", "D) 1/3"],
        correct_answer: "A) 3/10",
        explanation: "Probability = favorable outcomes / total outcomes = 3/(3+7) = 3/10",
        topic: "Statistics"
      }
    ];

    let addedCount = 0;
    let errors = [];

    for (const question of questionsToAdd) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .insert([question]);
          
        if (error) {
          errors.push(`Failed to add question: ${error.message}`);
        } else {
          addedCount++;
          console.log(`✅ Added: ${question.topic} - Level ${question.difficulty}`);
        }
      } catch (e) {
        errors.push(`Exception adding question: ${e.message}`);
      }
    }

    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Successfully added: ${addedCount} questions`);
    console.log(`❌ Failed to add: ${errors.length} questions`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => console.log(`   - ${err}`));
    }

    // Update current count
    await this.analyzeCurrentState();
    
    return { added: addedCount, errors: errors.length };
  }

  printImplementationPlan() {
    console.log('\n🚀 IMPLEMENTATION PLAN');
    console.log('=' .repeat(50));
    
    console.log('Phase 1: Foundation Expansion (Target: 40 questions)');
    console.log('   - Add 10 more Algebra questions (levels 1-2)');
    console.log('   - Add 8 more Geometry questions (levels 1-2)');
    console.log('   - Add 8 more Number questions (levels 1-2)');
    console.log('   - Add 5 more Statistics questions (levels 1-2)');
    
    console.log('\nPhase 2: Content Diversification (Target: 70 questions)');
    console.log('   - Introduce Trigonometry topic (12 questions)');
    console.log('   - Add Graphs/Coordinate Geometry (8 questions)');
    console.log('   - Expand existing topics with medium difficulty');
    
    console.log('\nPhase 3: Advanced Content (Target: 100 questions)');
    console.log('   - Add Level 3 (Hard) questions across all topics');
    console.log('   - Focus on IGCSE exam-style problems');
    console.log('   - Include multi-step problem solving');
    
    console.log('\n🛠️  TOOLS & RESOURCES:');
    console.log('   - Use add-mathematics-questions.js for bulk additions');
    console.log('   - Reference IGCSE Mathematics 0580 syllabus');
    console.log('   - Test new questions with comprehensive-test-suite.js');
    
    console.log('\n📏 QUALITY STANDARDS:');
    console.log('   - Each question must have 4 multiple choice options');
    console.log('   - Detailed step-by-step explanations required');
    console.log('   - Questions should be curriculum-aligned');
    console.log('   - Balanced difficulty distribution maintained');
  }

  async runFullAnalysis() {
    try {
      await this.analyzeCurrentState();
      this.generateExpansionPlan();
      this.generateSampleQuestions();
      this.printImplementationPlan();
      
      console.log('\n✨ READY TO EXPAND MATHEMATICS CONTENT!');
      console.log('   Run with --add-samples to add sample questions to database');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const strategy = new MathematicsExpansionStrategy();
  
  const addSamples = process.argv.includes('--add-samples');
  
  if (addSamples) {
    strategy.runFullAnalysis()
      .then(() => strategy.addSampleQuestions())
      .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  } else {
    strategy.runFullAnalysis().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }
}

module.exports = MathematicsExpansionStrategy;