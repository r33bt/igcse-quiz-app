# IGCSE Quiz App V2 - Implementation Plan

**Version**: 2.0  
**Date**: 2025-08-10  
**Approach**: Test-Driven Development (TDD)  

## 1. Development Phases

### Phase 1: Foundation & Authentication (Days 1-2)
**Goal**: Secure user authentication with basic profile management

**Test-First Approach**:
```typescript
// Write these tests BEFORE any code
describe('Authentication Flow', () => {
  it('redirects unauthenticated users to login')
  it('allows login with valid credentials')  
  it('creates user profile on first login')
  it('displays user info in header after login')
  it('allows logout with session cleanup')
})
```

**Implementation Order**:
1. Setup fresh Next.js project with TypeScript
2. Configure Supabase with environment variables
3. Write authentication tests
4. Implement Supabase auth integration
5. Create basic layout with header/navigation
6. Test all authentication flows manually

**Acceptance Criteria**:
- [ ] User can sign up with email/password
- [ ] User can login and see their email in header
- [ ] User can logout and is redirected to login
- [ ] All authentication tests pass
- [ ] No console errors on any auth flow

### Phase 2: Database & Basic Data (Days 3-4)
**Goal**: Working database with seed data and basic queries

**Test-First Approach**:
```typescript
describe('Database Operations', () => {
  it('fetches topics successfully')
  it('fetches questions by topic and difficulty')
  it('creates user profile on signup')
  it('handles database connection errors gracefully')
  it('returns appropriate error messages for failed queries')
})
```

**Implementation Order**:
1. Create database schema (SQL files)
2. Write database operation tests
3. Implement Supabase client with proper typing
4. Create seed data (5 topics, 25 easy questions)
5. Build database utility functions with error handling
6. Test all database operations

**Acceptance Criteria**:
- [ ] Database schema created and deployed
- [ ] RLS policies working correctly
- [ ] Seed data loaded (topics + questions)
- [ ] Database utilities handle errors gracefully
- [ ] All database tests pass

### Phase 3: Dashboard (Days 5-6)
**Goal**: Functional dashboard showing topics and user progress

**Test-First Approach**:
```typescript
describe('Dashboard Component', () => {
  it('displays available topics as cards')
  it('shows user XP and level correctly')
  it('displays recent quiz attempts')
  it('handles loading states gracefully')
  it('navigates to quiz on topic selection')
})
```

**Implementation Order**:
1. Write dashboard component tests
2. Create topic card component
3. Build progress summary component
4. Implement dashboard data fetching
5. Add loading and error states
6. Style with Tailwind CSS

**Acceptance Criteria**:
- [ ] Dashboard loads within 1 second
- [ ] Topics displayed as attractive cards
- [ ] User stats (XP, level) shown prominently
- [ ] Clicking topic navigates to quiz setup
- [ ] All dashboard tests pass

### Phase 4: Quiz Engine Core (Days 7-8)
**Goal**: Complete quiz-taking experience with 5 questions

**Test-First Approach**:
```typescript
describe('Quiz Engine', () => {
  it('fetches 5 random questions for selected topic/difficulty')
  it('displays questions one at a time')
  it('collects user answers correctly')
  it('shows immediate feedback after each answer')
  it('calculates final score accurately')
  it('handles edge cases (no questions available)')
})
```

**Implementation Order**:
1. Write quiz engine tests
2. Create Question component with feedback
3. Build QuizEngine state management
4. Implement question navigation (next/previous)
5. Add immediate feedback system
6. Create results calculation logic

**Acceptance Criteria**:
- [ ] Quiz loads 5 questions successfully
- [ ] Questions display clearly with options
- [ ] Immediate feedback works (correct/incorrect)
- [ ] User can navigate through all questions
- [ ] Score calculation is accurate
- [ ] All quiz engine tests pass

### Phase 5: Results & Data Persistence (Days 9-10)
**Goal**: Save quiz attempts and update user progress

**Test-First Approach**:
```typescript
describe('Quiz Results & Persistence', () => {
  it('saves quiz attempt to database correctly')
  it('updates user XP after quiz completion')
  it('calculates XP based on correct/incorrect answers')
  it('updates user progress for topic')
  it('handles save failures gracefully')
  it('displays results with earned XP')
})
```

**Implementation Order**:
1. Write quiz persistence tests
2. Implement quiz attempt saving logic
3. Create XP calculation system
4. Build user progress update mechanism
5. Design results page component
6. Add error handling for save failures

**Acceptance Criteria**:
- [ ] Quiz attempts saved with all relevant data
- [ ] User XP updated correctly after each quiz
- [ ] Results page shows score and XP earned
- [ ] Progress tracking works per topic
- [ ] Graceful handling of save failures
- [ ] All persistence tests pass

## 2. Test-Driven Development Workflow

### 2.1 Red-Green-Refactor Cycle
```
1. RED: Write failing test for specific functionality
2. GREEN: Write minimal code to make test pass
3. REFACTOR: Improve code while keeping tests green
4. REPEAT: Move to next small functionality
```

### 2.2 Testing Tools & Setup
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "cypress": "^13.6.1",
    "@cypress/code-coverage": "^3.12.8"
  }
}
```

### 2.3 Testing Standards
- **Unit Tests**: Every component, every utility function
- **Integration Tests**: Complete user journeys
- **Database Tests**: All CRUD operations
- **Error Handling Tests**: Network failures, invalid data
- **Performance Tests**: Load times under requirements

## 3. Quality Gates (Must Pass Before Next Phase)

### Phase Quality Checklist
- [ ] All tests pass (unit + integration)
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Manual testing completed
- [ ] Performance requirements met
- [ ] Code reviewed and refactored
- [ ] Documentation updated

### Continuous Integration Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run type-check
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run build
```

## 4. Error Handling Implementation Strategy

### 4.1 Component Level Error Handling
```typescript
// Every component follows this pattern
function QuizEngine({ topicId }: QuizEngineProps) {
  const [state, setState] = useState<QuizState>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true)
        const questions = await fetchQuestions(topicId)
        setState({ questions, currentIndex: 0 })
      } catch (err) {
        setError('Failed to load questions. Please try again.')
        console.error('Quiz loading error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadQuestions()
  }, [topicId])
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />
  if (!state?.questions?.length) return <NoQuestionsAvailable />
  
  return <QuizInterface {...state} />
}
```

### 4.2 Database Error Handling
```typescript
// Database utilities with comprehensive error handling
async function fetchQuestions(topicId: string, difficulty: number): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('difficulty_level', difficulty)
      .limit(5)
    
    if (error) throw new Error(`Database query failed: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No questions available for this topic')
    
    return data
  } catch (error) {
    // Log for debugging
    console.error('fetchQuestions error:', { topicId, difficulty, error })
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw new Error(error.message)
    } else {
      throw new Error('Unexpected error loading questions')
    }
  }
}
```

### 4.3 User Experience Error Handling
```typescript
// Graceful degradation patterns
function Dashboard({ user }: DashboardProps) {
  const { topics, loading, error } = useTopics()
  const { progress } = useUserProgress(user.id)
  
  return (
    <div>
      <UserStats user={user} progress={progress} />
      
      {loading && <TopicsLoading />}
      
      {error && (
        <ErrorBanner 
          message="Some content couldn't load"
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      )}
      
      {topics?.length > 0 ? (
        <TopicsGrid topics={topics} />
      ) : (
        <EmptyState message="No topics available yet" />
      )}
    </div>
  )
}
```

## 5. Performance Implementation Plan

### 5.1 Code Splitting
```typescript
// Lazy load heavy components
const QuizEngine = lazy(() => import('./QuizEngine'))
const Results = lazy(() => import('./Results'))

function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/quiz/:topicId" element={<QuizEngine />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Suspense>
  )
}
```

### 5.2 Database Query Optimization
```sql
-- Essential indexes for performance
CREATE INDEX idx_questions_topic_difficulty ON questions(topic_id, difficulty_level);
CREATE INDEX idx_quiz_attempts_user_date ON quiz_attempts(user_id, completed_at DESC);
CREATE INDEX idx_user_progress_user_topic ON user_progress(user_id, topic_id);
```

### 5.3 Caching Strategy
```typescript
// React Query for data caching
function useQuestions(topicId: string, difficulty: number) {
  return useQuery({
    queryKey: ['questions', topicId, difficulty],
    queryFn: () => fetchQuestions(topicId, difficulty),
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
```

## 6. Deployment Strategy

### 6.1 Environment Setup
```bash
# Development
npm run dev          # Local development server
npm run test:watch   # Continuous testing
npm run db:migrate   # Database migrations

# Staging  
npm run build        # Production build
npm run test:e2e     # End-to-end tests
npm run deploy:staging

# Production
npm run test:all     # Full test suite
npm run build:prod   # Optimized build
npm run deploy:prod
```

### 6.2 Database Migration Strategy
```sql
-- migration_001_initial_schema.sql
-- All table creation statements

-- migration_002_seed_data.sql  
-- Initial topics and questions

-- migration_003_add_indexes.sql
-- Performance indexes
```

## 7. Success Metrics

### 7.1 Technical Metrics
- [ ] **Test Coverage**: >90% for components, >95% for utilities
- [ ] **Performance**: All pages load under target times
- [ ] **Error Rate**: <1% in production
- [ ] **Build Time**: <3 minutes
- [ ] **Bundle Size**: <500KB gzipped

### 7.2 User Experience Metrics
- [ ] **Quiz Completion Rate**: >80% of started quizzes finished
- [ ] **Error Recovery**: Users can recover from all error states
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Mobile Performance**: Works on all device sizes

This implementation plan ensures that every line of code is tested before it's written, every feature is thoroughly validated, and the final product is robust, performant, and user-friendly.

**Ready to begin Phase 1 with Test-Driven Development approach.**