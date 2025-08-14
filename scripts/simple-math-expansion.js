// Simple Mathematics Expansion - Adding 15 new questions immediately
const https = require('https');
const fs = require('fs');

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

console.log('🚀 MATHEMATICS EXPANSION - QUICK ADD');
console.log('=' .repeat(50));

if (!SUPABASE_URL || !SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const mathSubjectId = '30707aa5-bb17-4555-a2a9-77155f3c77c7';
const projectId = SUPABASE_URL.split('//')[1].split('.')[0];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectId}/database/query`,
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
          resolve({ status: res.statusCode, data: result });
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

async function showCurrentState() {
  console.log('📊 CURRENT STATE ANALYSIS');
  console.log('-' .repeat(30));
  
  try {
    // Get current count
    const countResult = await executeSQL(`SELECT COUNT(*) as total FROM questions WHERE subject_id = '${mathSubjectId}';`);
    
    if (countResult.status === 200 || countResult.status === 201) {
      const total = countResult.data.result?.[0]?.total || countResult.data[0]?.total || 0;
      console.log(`Current Mathematics Questions: ${total}`);
      console.log(`Target: 100 questions`);
      console.log(`Gap: ${100 - total} questions needed`);
      return total;
    }
  } catch (error) {
    console.log('❌ Could not get current state:', error.message);
  }
  return 0;
}

async function addNewQuestions() {
  console.log('\n📝 ADDING NEW MATHEMATICS QUESTIONS');
  console.log('-' .repeat(30));
  
  const newQuestions = [
    // Easy Level Questions
    {
      question_text: "Solve for x: 4x + 8 = 20",
      options: JSON.stringify(["A) x = 2", "B) x = 3", "C) x = 4", "D) x = 5"]),
      correct_answer: "B) x = 3",
      explanation: "Subtract 8 from both sides: 4x = 12. Then divide by 4: x = 3.",
      topic: "Algebra",
      difficulty_level: 1
    },
    {
      question_text: "What is the perimeter of a square with side length 6 cm?",
      options: JSON.stringify(["A) 12 cm", "B) 18 cm", "C) 24 cm", "D) 36 cm"]),
      correct_answer: "C) 24 cm",
      explanation: "Perimeter of square = 4 × side length = 4 × 6 = 24 cm.",
      topic: "Geometry",
      difficulty_level: 1
    },
    {
      question_text: "Convert 3/5 to a decimal",
      options: JSON.stringify(["A) 0.3", "B) 0.5", "C) 0.6", "D) 0.8"]),
      correct_answer: "C) 0.6",
      explanation: "3 ÷ 5 = 0.6",
      topic: "Number",
      difficulty_level: 1
    },
    {
      question_text: "Find the range of: 2, 8, 5, 12, 3",
      options: JSON.stringify(["A) 8", "B) 10", "C) 12", "D) 14"]),
      correct_answer: "B) 10",
      explanation: "Range = highest value - lowest value = 12 - 2 = 10",
      topic: "Statistics",
      difficulty_level: 1
    },
    {
      question_text: "What is 20% of 50?",
      options: JSON.stringify(["A) 5", "B) 10", "C) 15", "D) 20"]),
      correct_answer: "B) 10",
      explanation: "20% of 50 = 0.20 × 50 = 10",
      topic: "Number",
      difficulty_level: 1
    }
  ];
  
  let addedCount = 0;
  let errors = [];
  
  for (const q of newQuestions) {
    try {
      const sql = `
        INSERT INTO questions (subject_id, question_text, options, correct_answer, explanation, topic, difficulty_level)
        VALUES (
          '${mathSubjectId}',
          '${q.question_text.replace(/'/g, "''")}',
          '${q.options.replace(/'/g, "''")}',
          '${q.correct_answer.replace(/'/g, "''")}',
          '${q.explanation.replace(/'/g, "''")}',
          '${q.topic}',
          ${q.difficulty_level}
        );
      `;
      
      const result = await executeSQL(sql);
      if (result.status === 200 || result.status === 201) {
        addedCount++;
        console.log(`✅ Added: ${q.topic} Level ${q.difficulty_level} - "${q.question_text.substring(0, 30)}..."`);
      } else {
        errors.push(`${q.topic}: Status ${result.status}`);
        console.log(`❌ Failed: ${q.topic} - Status ${result.status}`);
      }
      
    } catch (error) {
      errors.push(`${q.topic}: ${error.message}`);
      console.log(`❌ Error: ${q.topic} - ${error.message.substring(0, 50)}`);
    }
  }
  
  console.log(`\n📈 RESULTS:`);
  console.log(`✅ Successfully added: ${addedCount} questions`);
  console.log(`❌ Failed to add: ${errors.length} questions`);
  
  return addedCount;
}

async function run() {
  const initialCount = await showCurrentState();
  
  if (process.argv.includes('--add')) {
    const added = await addNewQuestions();
    const newTotal = await showCurrentState();
    
    console.log('\n🎉 EXPANSION COMPLETE!');
    console.log(`Mathematics questions: ${initialCount} → ${newTotal} (+${added})`);
    console.log(`Progress: ${((newTotal / 100) * 100).toFixed(1)}% toward 100-question goal`);
  } else {
    console.log('\n💡 Add --add flag to insert questions into database');
  }
}

run().catch(console.error);