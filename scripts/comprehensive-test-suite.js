require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class ComprehensiveTestSuite {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runTest(name, testFunc) {
    console.log(`\n🧪 ${name}`);
    console.log('-'.repeat(50));
    
    const testStart = Date.now();
    
    try {
      const result = await testFunc();
      const duration = Date.now() - testStart;
      
      console.log(`✅ PASSED: ${name} (${duration}ms)`);
      this.testResults.push({ name, status: 'passed', duration, result });
      return result;
      
    } catch (error) {
      const duration = Date.now() - testStart;
      console.log(`❌ FAILED: ${name} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ name, status: 'failed', duration, error: error.message });
      throw error;
    }
  }

  // Database Schema Tests
  async testDatabaseSchema() {
    return this.runTest('Database Schema Integrity', async () => {
      // Test all core tables exist
      const tables = ['profiles', 'subjects', 'questions', 'quiz_attempts', 'user_progress', 'quiz_sessions'];
      const results = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1);
          results[table] = error ? 'ERROR: ' + error.message : 'OK';
        } catch (e) {
          results[table] = 'EXCEPTION: ' + e.message;
        }
      }
      
      const failedTables = Object.entries(results).filter(([table, status]) => !status.includes('OK'));
      if (failedTables.length > 0) {
        throw new Error(`Tables failed: ${failedTables.map(([t, s]) => `${t}: ${s}`).join(', ')}`);
      }
      
      return results;
    });
  }

  // Data Quality Tests
  async testDataQuality() {
    return this.runTest('Data Quality Validation', async () => {
      const issues = [];
      
      // Test questions have proper structure
      const { data: questions } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_answer, explanation');
        
      for (const q of questions || []) {
        if (!q.question_text || q.question_text.trim().length < 10) {
          issues.push(`Question ${q.id}: Question text too short`);
        }
        
        if (!Array.isArray(q.options) || q.options.length < 2) {
          issues.push(`Question ${q.id}: Invalid options array`);
        }
        
        if (!q.correct_answer) {
          issues.push(`Question ${q.id}: Missing correct answer`);
        }
        
        if (Array.isArray(q.options) && !q.options.includes(q.correct_answer)) {
          issues.push(`Question ${q.id}: Correct answer not in options`);
        }
      }
      
      if (issues.length > 0) {
        console.log('⚠️  Data quality issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      return {
        questionsChecked: questions?.length || 0,
        issuesFound: issues.length,
        issues: issues
      };
    });
  }

  // Performance Tests
  async testPerformance() {
    return this.runTest('Database Performance', async () => {
      const performanceResults = {};
      
      // Test query performance
      const queries = [
        { name: 'subjects_fetch', query: () => supabase.from('subjects').select('*') },
        { name: 'questions_by_subject', query: () => supabase.from('questions').select('*').eq('subject_id', '550e8400-e29b-41d4-a716-446655440001').limit(10) },
        { name: 'user_progress_lookup', query: () => supabase.from('user_progress').select('*').limit(5) },
        { name: 'quiz_attempts_recent', query: () => supabase.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(10) }
      ];
      
      for (const { name, query } of queries) {
        const start = Date.now();
        try {
          const { data, error } = await query();
          const duration = Date.now() - start;
          
          performanceResults[name] = {
            duration: duration,
            status: error ? 'ERROR' : 'SUCCESS',
            recordCount: data?.length || 0,
            error: error?.message
          };
          
          if (duration > 1000) {
            console.log(`⚠️  Slow query: ${name} took ${duration}ms`);
          }
        } catch (e) {
          performanceResults[name] = {
            duration: Date.now() - start,
            status: 'EXCEPTION',
            error: e.message
          };
        }
      }
      
      return performanceResults;
    });
  }

  // User Journey Simulation
  async testUserJourney() {
    return this.runTest('User Journey Simulation', async () => {
      const journey = {};
      
      // Step 1: Fetch subjects (dashboard load)
      const start1 = Date.now();
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*');
      journey.subjects_load = {
        duration: Date.now() - start1,
        success: !subjectsError,
        count: subjects?.length || 0
      };
      
      if (subjectsError) throw new Error('Failed to load subjects: ' + subjectsError.message);
      
      // Step 2: Get questions for Mathematics (quiz start)
      const mathSubject = subjects.find(s => s.name === 'Mathematics');
      if (!mathSubject) throw new Error('Mathematics subject not found');
      
      const start2 = Date.now();
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', mathSubject.id)
        .limit(5);
      journey.questions_load = {
        duration: Date.now() - start2,
        success: !questionsError,
        count: questions?.length || 0
      };
      
      if (questionsError) throw new Error('Failed to load questions: ' + questionsError.message);
      
      // Step 3: Test data structure integrity
      journey.data_integrity = {
        questionsHaveOptions: questions.every(q => Array.isArray(q.options) && q.options.length >= 2),
        questionsHaveAnswers: questions.every(q => q.correct_answer),
        questionsHaveText: questions.every(q => q.question_text && q.question_text.length > 0)
      };
      
      return journey;
    });
  }

  // Application Health Check
  async testApplicationHealth() {
    return this.runTest('Application Health Check', async () => {
      const health = {
        timestamp: new Date().toISOString(),
        checks: {}
      };
      
      // Database connectivity
      const { data: dbTest, error: dbError } = await supabase
        .from('subjects')
        .select('count(*)');
      health.checks.database = {
        status: dbError ? 'FAIL' : 'PASS',
        error: dbError?.message
      };
      
      // Content availability
      const { data: questionCount } = await supabase
        .from('questions')
        .select('count()');
      health.checks.content = {
        status: questionCount && questionCount[0]?.count > 0 ? 'PASS' : 'FAIL',
        questionCount: questionCount?.[0]?.count || 0
      };
      
      // Authentication system
      try {
        const { data: { session } } = await supabase.auth.getSession();
        health.checks.auth = {
          status: 'PASS',
          note: 'Auth system accessible'
        };
      } catch (e) {
        health.checks.auth = {
          status: 'FAIL',
          error: e.message
        };
      }
      
      return health;
    });
  }

  async runAllTests() {
    console.log('🚀 COMPREHENSIVE TEST SUITE');
    console.log('=' .repeat(60));
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('=' .repeat(60));

    try {
      // Run all test categories
      await this.testDatabaseSchema();
      await this.testDataQuality();
      await this.testPerformance();
      await this.testUserJourney();
      await this.testApplicationHealth();
      
      this.printSummary();
      
    } catch (error) {
      console.log(`\n💥 Test suite stopped due to critical failure: ${error.message}`);
      this.printSummary();
      process.exit(1);
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'failed')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n🎯 Recommendations:');
    if (failed === 0) {
      console.log('   ✅ All systems operational - ready for production');
    } else {
      console.log('   🔧 Fix failed tests before deployment');
    }
    
    const avgDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0) / this.testResults.length;
    if (avgDuration > 500) {
      console.log('   ⚡ Consider optimizing slow queries for better performance');
    }
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestSuite;