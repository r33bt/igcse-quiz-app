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

async function getSubjects() {
  const sql = `SELECT id, name, code, description FROM subjects ORDER BY name;`;
  const result = await executeSQL(sql);
  
  console.log('📚 AVAILABLE SUBJECTS:');
  console.log('=' .repeat(50));
  
  const subjects = result.result || result;
  subjects.forEach(subject => {
    console.log(`${subject.name}: ${subject.id}`);
    console.log(`   Code: ${subject.code || 'N/A'}`);
    console.log(`   Description: ${subject.description || 'N/A'}`);
    console.log('');
  });
}

getSubjects().catch(console.error);