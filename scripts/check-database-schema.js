// Quick Database Schema Check
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

if (!SUPABASE_URL || !SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const projectId = SUPABASE_URL.split('//')[1].split('.')[0];
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

async function checkSchema() {
  console.log('🔍 DATABASE SCHEMA CHECK');
  console.log('=' .repeat(40));
  
  try {
    // Check questions table structure
    const schemaSQL = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'questions' 
      ORDER BY ordinal_position;
    `;
    
    const schema = await executeSQL(schemaSQL);
    console.log('\n📋 QUESTIONS TABLE COLUMNS:');
    const columns = schema.result || schema;
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check current questions count and structure
    const countSQL = `
      SELECT 
        COUNT(*) as total_questions,
        topic,
        COUNT(*) as topic_count
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id 
      WHERE s.name = 'Mathematics'
      GROUP BY topic
      ORDER BY topic_count DESC;
    `;
    
    const countResult = await executeSQL(countSQL);
    console.log('\n📊 CURRENT MATHEMATICS QUESTIONS:');
    const counts = countResult.result || countResult;
    let total = 0;
    if (Array.isArray(counts)) {
      counts.forEach(row => {
        console.log(`   ${row.topic}: ${row.topic_count} questions`);
        total += parseInt(row.topic_count);
      });
    }
    console.log(`   TOTAL: ${total} questions`);
    
    // Sample a few questions to understand structure
    const sampleSQL = `
      SELECT q.id, q.question_text, q.topic, q.options, q.correct_answer
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id 
      WHERE s.name = 'Mathematics'
      LIMIT 3;
    `;
    
    const samples = await executeSQL(sampleSQL);
    console.log('\n📝 SAMPLE QUESTIONS:');
    const sampleData = samples.result || samples;
    if (Array.isArray(sampleData)) {
      sampleData.forEach((q, i) => {
        console.log(`\n${i + 1}. ${q.question_text.substring(0, 60)}...`);
        console.log(`   Topic: ${q.topic || 'No topic'}`);
        console.log(`   Options: ${Array.isArray(q.options) ? q.options.length + ' options' : 'Invalid options'}`);
        console.log(`   Answer: ${q.correct_answer}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema();