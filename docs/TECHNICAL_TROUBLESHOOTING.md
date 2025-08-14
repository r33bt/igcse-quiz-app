# Technical Troubleshooting Guide - IGCSE Quiz App

## **Quick Reference Commands**

### **Database Schema Verification**
```bash
# Check table structure
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('quiz_attempts').select('*').limit(1).then(({data,error}) => {
  if (data?.[0]) console.log('Columns:', Object.keys(data[0]).sort().join(', '));
  if (error) console.log('Error:', error.message);
});
"

# Check data counts
node scripts/test-full-app.js

# Check specific user data
node scripts/check-test-user.js
```

### **Supabase Schema Issues**
```sql
-- In Supabase SQL Editor: Check actual table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Alternative cache refresh
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_reload_conf();
```

## **Common Issues & Solutions**

### **1. "Column does not exist" API Errors**

**Problem**: Database columns exist but Supabase API can't access them
```
Error: column quiz_attempts.quiz_session_id does not exist
```

**Root Cause**: Supabase API schema cache not updated after DDL changes

**Solution Options**:
1. **Wait 5-10 minutes** for automatic cache refresh
2. **Run schema refresh SQL**: `NOTIFY pgrst, 'reload schema';`
3. **Restart Supabase project**: Settings → General → Restart Project
4. **Clear browser cache** and refresh application

**Verification**:
```bash
# Test column access after cache refresh
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('quiz_attempts').select('quiz_session_id, question_order').limit(1)
  .then(({error}) => console.log(error ? 'Still cached' : 'Cache refreshed!'));
"
```

### **2. Quiz History Shows Zero Data**

**Problem**: History page shows "No Quiz History Yet" despite user having quiz attempts

**Root Causes**:
- `quiz_sessions` table empty (new system)
- `quiz_attempts` missing `quiz_session_id` column
- API schema cache issues

**Diagnosis Commands**:
```bash
# Check quiz_sessions table
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
Promise.all([
  supabase.from('quiz_sessions').select('*', { count: 'exact', head: true }),
  supabase.from('quiz_attempts').select('*', { count: 'exact', head: true })
]).then(([sessions, attempts]) => {
  console.log('Quiz sessions:', sessions.count);
  console.log('Quiz attempts:', attempts.count);
});
"
```

**Solution**:
1. **Complete database migration** (add missing columns)
2. **Restart Supabase project** to refresh API schema
3. **Take new quiz** to create first quiz_session
4. **Legacy data**: Will remain as individual attempts without session grouping

### **3. Authentication Issues**

**Problem**: Users can't sign in or get JWT errors

**Common Errors**:
- "JWT expired"
- "Invalid token"
- "User not found"

**Solutions**:
```bash
# Check auth configuration
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.auth.getSession().then(({data, error}) => {
  console.log('Session valid:', !error);
  if (error) console.log('Auth error:', error.message);
});
"
```

**Supabase Auth Settings**:
- **Site URL**: https://igcse-quiz-app.vercel.app
- **Redirect URLs**: https://igcse-quiz-app.vercel.app/**
- **Email Settings**: Confirm email disabled for development

### **4. Build/Deployment Failures**

**Problem**: Vercel builds fail with TypeScript errors

**Common Errors**:
- "Property 'X' does not exist"
- "Argument of type 'X' is not assignable"
- "React Hook useEffect has missing dependencies"

**Solutions**:
```bash
# Local type checking
npm run build

# Fix common React Hook issues
# Add dependencies to useCallback/useEffect arrays
# Use eslint-disable comments for known safe cases

# Example fix for useCallback:
const loadData = useCallback(async () => {
  // async logic
}, [dependency1, dependency2]) // Add all dependencies
```

### **5. Data Inconsistencies**

**Problem**: User progress not matching quiz attempts

**Diagnosis**:
```bash
# Check user progress calculation
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConsistency() {
  const userId = 'USER_ID_HERE';
  
  const [profile, attempts, progress] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('quiz_attempts').select('*').eq('user_id', userId),
    supabase.from('user_progress').select('*').eq('user_id', userId)
  ]);
  
  console.log('Profile XP:', profile.data?.xp);
  console.log('Total attempts:', attempts.data?.length);
  console.log('Calculated XP:', attempts.data?.reduce((sum, a) => sum + a.xp_earned, 0));
  console.log('Progress records:', progress.data?.length);
}

checkConsistency();
"
```

**Fixes**:
- **Recalculate user progress**: Run progress sync scripts
- **Check UPSERT logic**: Ensure progress updates correctly
- **Verify XP calculation**: Match earning rules with database

## **Database Migration Procedures**

### **Schema Changes**
1. **Always backup first**: Supabase handles this automatically
2. **Use transactions**: Wrap DDL in BEGIN/COMMIT blocks
3. **Test in development**: Verify changes before production
4. **Document changes**: Update this guide and CLAUDE.md

### **Adding Columns**
```sql
-- Template for adding columns
BEGIN;
ALTER TABLE table_name ADD COLUMN column_name data_type;
-- Add constraints if needed
ALTER TABLE table_name ADD CONSTRAINT constraint_name ...;
-- Create indexes if needed
CREATE INDEX index_name ON table_name(column_name);
COMMIT;

-- Force API schema refresh
NOTIFY pgrst, 'reload schema';
```

### **RLS Policy Updates**
```sql
-- Template for RLS policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name
  FOR operation USING (auth.uid() = user_id);
```

## **Performance Optimization**

### **Database Query Optimization**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%quiz_%'
ORDER BY mean_exec_time DESC;

-- Analyze table statistics
ANALYZE quiz_attempts;
ANALYZE quiz_sessions;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename IN ('quiz_attempts', 'quiz_sessions');
```

### **API Performance**
```bash
# Test API response times
time curl "https://nkcjwrksvmjzqsatwkac.supabase.co/rest/v1/quiz_attempts?select=*&limit=10" \
  -H "apikey: YOUR_ANON_KEY"

# Check connection pooling
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('URL', 'KEY');
console.time('query');
supabase.from('questions').select('*').limit(1).then(() => console.timeEnd('query'));
"
```

## **Environment Setup Verification**

### **Required Environment Variables**
```bash
# .env.local file contents
NEXT_PUBLIC_SUPABASE_URL=https://nkcjwrksvmjzqsatwkac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Verify variables are loaded
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
console.log('Anon key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
console.log('Service key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
"
```

### **Vercel Deployment Variables**
```bash
# Check Vercel environment variables
vercel env ls

# Add missing variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## **Monitoring & Logging**

### **Application Logs**
```bash
# Vercel function logs
vercel logs --app igcse-quiz-app

# Local development logs
npm run dev -- --debug

# Check browser console for client errors
# Network tab for API request/response details
```

### **Database Monitoring**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Monitor query performance
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## **Emergency Procedures**

### **System Down Recovery**
1. **Check Vercel status**: https://vercel.com/status
2. **Check Supabase status**: https://status.supabase.com/
3. **Verify DNS resolution**: `nslookup igcse-quiz-app.vercel.app`
4. **Test API endpoints**: Direct Supabase REST API calls
5. **Rollback if needed**: Revert to last working commit

### **Data Recovery**
1. **Supabase automatic backups**: Available in dashboard
2. **Point-in-time recovery**: Up to 7 days on free plan
3. **Manual data export**: Use pg_dump equivalent in Supabase
4. **User notification**: Inform users of any data issues

### **Contact Information**
- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com
- **Repository Issues**: https://github.com/r33bt/igcse-quiz-app/issues

---

**Last Updated**: 2025-08-10  
**Maintained By**: Development Team  
**Review Schedule**: Monthly or after major changes