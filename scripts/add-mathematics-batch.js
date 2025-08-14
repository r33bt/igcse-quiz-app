// Mathematics Question Expansion - Direct Database Addition
// Uses existing .env.local configuration for automated question insertion

const https = require('https');
const fs = require('fs');

// Read environment variables from .env.local
function loadEnvLocal() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
  
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

class MathematicsExpansion {
  constructor() {
    this.projectId = SUPABASE_URL.split('//')[1].split('.')[0];
    this.mathSubjectId = '30707aa5-bb17-4555-a2a9-77155f3c77c7'; // Mathematics UUID
  }

  async executeSQL(sql) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ query: sql });
      
      const options = {
        hostname: 'api.supabase.com',
        port: 443,
        path: `/v1/projects/${this.projectId}/database/query`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(result);
            } else {
              reject(new Error(`API Error: ${result.message || data}`));
            }
          } catch (e) {
            reject(new Error(`Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  getNewMathQuestions() {
    return [
      // Easy Algebra Questions (Level 1)
      {
        question_text: "Solve for x: 4x + 8 = 20",
        options: ["A) x = 2", "B) x = 3", "C) x = 4", "D) x = 5"],
        correct_answer: "B) x = 3",
        explanation: "Subtract 8 from both sides: 4x = 12. Then divide by 4: x = 3.",
        topic: "Algebra",
        difficulty: 1
      },
      {
        question_text: "What is the value of 7x when x = 2?",
        options: ["A) 9", "B) 12", "C) 14", "D) 16"],
        correct_answer: "C) 14",
        explanation: "Substitute x = 2 into 7x: 7(2) = 14.",
        topic: "Algebra",
        difficulty: 1
      },
      {
        question_text: "Simplify: 5x + 3x",
        options: ["A) 8x", "B) 8x²", "C) 15x", "D) 5x + 3x"],
        correct_answer: "A) 8x",
        explanation: "Combine like terms: 5x + 3x = 8x.",
        topic: "Algebra",
        difficulty: 1
      },
      
      // Easy Geometry Questions (Level 1)
      {
        question_text: "What is the perimeter of a square with side length 6 cm?",
        options: ["A) 12 cm", "B) 18 cm", "C) 24 cm", "D) 36 cm"],
        correct_answer: "C) 24 cm",
        explanation: "Perimeter of square = 4 × side length = 4 × 6 = 24 cm.",
        topic: "Geometry",
        difficulty: 1
      },
      {
        question_text: "What is the area of a square with side length 5 cm?",
        options: ["A) 10 cm²", "B) 20 cm²", "C) 25 cm²", "D) 30 cm²"],
        correct_answer: "C) 25 cm²",
        explanation: "Area of square = side² = 5² = 25 cm².",
        topic: "Geometry",
        difficulty: 1
      },
      {
        question_text: "How many sides does a hexagon have?",
        options: ["A) 5", "B) 6", "C) 7", "D) 8"],
        correct_answer: "B) 6",
        explanation: "A hexagon is a polygon with 6 sides. 'Hex' means six.",
        topic: "Geometry",
        difficulty: 1
      },
      
      // Easy Number Questions (Level 1)
      {
        question_text: "Convert 3/5 to a decimal",
        options: ["A) 0.3", "B) 0.5", "C) 0.6", "D) 0.8"],
        correct_answer: "C) 0.6",
        explanation: "3 ÷ 5 = 0.6",
        topic: "Number",
        difficulty: 1
      },
      {
        question_text: "What is 20% of 50?",
        options: ["A) 5", "B) 10", "C) 15", "D) 20"],
        correct_answer: "B) 10",
        explanation: "20% of 50 = 0.20 × 50 = 10",
        topic: "Number",
        difficulty: 1
      },
      {
        question_text: "Round 47.8 to the nearest whole number",
        options: ["A) 47", "B) 48", "C) 49", "D) 50"],
        correct_answer: "B) 48",
        explanation: "Since .8 ≥ 0.5, we round up to 48.",
        topic: "Number",
        difficulty: 1
      },
      
      // Medium Algebra Questions (Level 2)
      {
        question_text: "Expand: (x + 5)(x + 3)",
        options: ["A) x² + 8x + 15", "B) x² + 8x + 8", "C) x² + 15x + 8", "D) x² + 2x + 15"],
        correct_answer: "A) x² + 8x + 15",
        explanation: "Using FOIL: x² + 3x + 5x + 15 = x² + 8x + 15",
        topic: "Algebra",
        difficulty: 2
      },
      {
        question_text: "Solve: 3(x + 2) = 15",
        options: ["A) x = 3", "B) x = 4", "C) x = 5", "D) x = 7"],
        correct_answer: "A) x = 3",
        explanation: "3(x + 2) = 15 → 3x + 6 = 15 → 3x = 9 → x = 3",
        topic: "Algebra",
        difficulty: 2
      },
      
      // Easy Statistics Questions (Level 1)
      {
        question_text: "Find the range of: 2, 8, 5, 12, 3",
        options: ["A) 8", "B) 10", "C) 12", "D) 14"],
        correct_answer: "B) 10",
        explanation: "Range = highest value - lowest value = 12 - 2 = 10",
        topic: "Statistics",
        difficulty: 1
      },
      {
        question_text: "What is the mode of: 4, 7, 4, 9, 4, 6?",
        options: ["A) 4", "B) 6", "C) 7", "D) 9"],
        correct_answer: "A) 4",
        explanation: "The mode is the most frequently occurring value. 4 appears three times.",
        topic: "Statistics",
        difficulty: 1
      },
      
      // Medium Geometry Questions (Level 2)
      {
        question_text: "What is the area of a circle with radius 5 cm? (Use π = 3.14)",
        options: ["A) 31.4 cm²", "B) 62.8 cm²", "C) 78.5 cm²", "D) 157 cm²"],
        correct_answer: "C) 78.5 cm²",
        explanation: "Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5 cm²",
        topic: "Geometry",
        difficulty: 2
      },
      {
        question_text: "What is the volume of a cube with side length 3 cm?",
        options: ["A) 9 cm³", "B) 18 cm³", "C) 27 cm³", "D) 36 cm³"],
        correct_answer: "C) 27 cm³",
        explanation: "Volume of cube = side³ = 3³ = 27 cm³",
        topic: "Geometry",
        difficulty: 2
      }
    ];
  }

  async addQuestionsToDatabase() {
    console.log('📝 ADDING MATHEMATICS QUESTIONS TO DATABASE');
    console.log('=' .repeat(50));
    
    const questions = this.getNewMathQuestions();
    let addedCount = 0;
    let errors = [];

    for (const question of questions) {
      try {
        const sql = `
          INSERT INTO questions (subject_id, question_text, options, correct_answer, explanation, topic, difficulty_level)
          VALUES (
            '${this.mathSubjectId}',
            '${question.question_text.replace(/'/g, "''")}',
            '${JSON.stringify(question.options).replace(/'/g, "''")}',
            '${question.correct_answer.replace(/'/g, "''")}',
            '${question.explanation.replace(/'/g, "''")}',
            '${question.topic}',
            ${question.difficulty}
          );
        `;
        
        await this.executeSQL(sql);
        addedCount++;
        console.log(`✅ Added: ${question.topic} - Level ${question.difficulty} - "${question.question_text.substring(0, 40)}..."`);
        
      } catch (error) {
        errors.push(`${question.topic}: ${error.message}`);
        console.log(`❌ Failed: ${question.topic} - ${error.message.substring(0, 50)}`);
      }
    }

    console.log(`\n📊 RESULTS:`);
    console.log(`✅ Successfully added: ${addedCount} questions`);
    console.log(`❌ Failed to add: ${errors.length} questions`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
      if (errors.length > 3) {
        console.log(`   - ... and ${errors.length - 3} more errors`);
      }
    }

    return { added: addedCount, failed: errors.length, totalQuestions: questions.length };
  }

  async checkCurrentState() {
    console.log('🔍 CHECKING CURRENT MATHEMATICS CONTENT');
    console.log('=' .repeat(50));

    try {
      const sql = `
        SELECT 
          topic,
          difficulty_level,
          COUNT(*) as count
        FROM questions 
        WHERE subject_id = '${this.mathSubjectId}'
        GROUP BY topic, difficulty_level
        ORDER BY topic, difficulty_level;
      `;
      
      const result = await this.executeSQL(sql);
      
      console.log('Current Distribution:');
      const rows = result.result || result;
      if (Array.isArray(rows)) {
        rows.forEach(row => {
          console.log(`   ${row.topic} Level ${row.difficulty_level}: ${row.count} questions`);
        });
      }
      
      // Get total count
      const totalSQL = `SELECT COUNT(*) as total FROM questions WHERE subject_id = '${this.mathSubjectId}';`;
      const totalResult = await this.executeSQL(totalSQL);
      const total = totalResult.result?.[0]?.total || totalResult[0]?.total || 0;
      
      console.log(`\n📊 Total Mathematics Questions: ${total}`);
      console.log(`🎯 Target: 100 questions`);
      console.log(`📈 Gap: ${100 - total} questions needed`);
      
      return { total, distribution: rows };
      
    } catch (error) {
      console.error('❌ Failed to check current state:', error.message);
      throw error;
    }
  }

  printExpansionPlan() {
    console.log('\n🎯 MATHEMATICS EXPANSION PLAN');
    console.log('=' .repeat(50));
    
    console.log('✅ PHASE 1 - Foundation Questions (40% Easy)');
    console.log('   - Algebra: Basic equation solving, simplification');
    console.log('   - Geometry: Area, perimeter, basic shapes');
    console.log('   - Number: Fractions, decimals, percentages');
    console.log('   - Statistics: Mean, median, mode, range');
    
    console.log('\n🎯 PHASE 2 - Intermediate Questions (45% Medium)');  
    console.log('   - Algebra: Expanding brackets, factoring');
    console.log('   - Geometry: Circle calculations, volume');
    console.log('   - Number: Ratio, proportion, compound interest');
    console.log('   - Statistics: Probability, data interpretation');
    
    console.log('\n🔥 PHASE 3 - Advanced Questions (15% Hard)');
    console.log('   - Algebra: Quadratic equations, simultaneous equations');
    console.log('   - Geometry: Trigonometry, coordinate geometry');
    console.log('   - Number: Standard form, indices');
    console.log('   - Statistics: Cumulative frequency, scatter graphs');
    
    console.log('\n📚 CONTENT STANDARDS:');
    console.log('   - Aligned with IGCSE Mathematics 0580 syllabus');
    console.log('   - 4 multiple choice options per question');
    console.log('   - Detailed step-by-step explanations');
    console.log('   - Progressive difficulty within each topic');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Run this script to add 15 new questions immediately');
    console.log('   2. Review question quality and distribution');
    console.log('   3. Repeat process until reaching 100 questions');
    console.log('   4. Test all new questions with quiz system');
  }

  async run() {
    try {
      await this.checkCurrentState();
      this.printExpansionPlan();
      
      console.log('\n🤔 ADD QUESTIONS NOW?');
      console.log('   Add --execute flag to add questions to database');
      
      if (process.argv.includes('--execute')) {
        console.log('\n🚀 EXECUTING QUESTION ADDITION...');
        const results = await this.addQuestionsToDatabase();
        
        console.log('\n✨ EXPANSION COMPLETE!');
        console.log(`   Added ${results.added}/${results.totalQuestions} questions successfully`);
        
        // Check new state
        await this.checkCurrentState();
      }
      
    } catch (error) {
      console.error('❌ Expansion failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const expansion = new MathematicsExpansion();
  expansion.run();
}

module.exports = MathematicsExpansion;