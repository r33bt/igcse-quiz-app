# IGCSE Quiz App - Technical Specification

**Version**: 1.0  
**Date**: 2025-08-10  
**Status**: Critical Issues Resolution Plan  

## 1. Immediate Production Issues

### Issue 1: Database 400 Errors on quiz_attempts

**Error**: `Failed to load resource: the server responded with a status of 400`
**Root Cause**: Database permission or schema mismatch
**Solution**:
```sql
-- Check RLS policies for quiz_attempts table
-- Ensure user can INSERT with proper user_id matching
```

### Issue 2: TypeScript Runtime Errors (r.map is not a function)

**Error**: `Uncaught TypeError: r.map is not a function`
**Root Cause**: Arrays coming as null/undefined despite defensive programming
**Solution**: Implement comprehensive type guards and error boundaries

### Issue 3: Unhandled Promise Rejections

**Error**: Multiple database operation failures causing app crashes
**Root Cause**: Missing error handling in async operations
**Solution**: Wrap all database operations in try-catch with user-friendly fallbacks

## 2. Error Handling Architecture

### 2.1 React Error Boundary Implementation

```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // TODO: Send to error monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2.2 Database Operation Wrapper

```typescript
// lib/database-operations.ts
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage || 'Database operation failed:', error)
    // TODO: Send to error monitoring
    return fallback || null
  }
}
```

### 2.3 Type-Safe Array Operations

```typescript
// lib/type-guards.ts
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

export function safeMap<T, U>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => U
): U[] {
  if (!isArray(array)) {
    console.warn('safeMap called with non-array:', array)
    return []
  }
  return array.map(mapper)
}
```

## 3. Database Schema Validation

### 3.1 Zod Schema Definitions

```typescript
// lib/schemas.ts
import { z } from 'zod'

export const QuizAttemptSchema = z.object({
  user_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  question_id: z.string().uuid(),
  user_answer: z.string().min(1),
  correct_answer: z.string().min(1),
  is_correct: z.boolean(),
  time_taken_seconds: z.number().min(0),
  xp_earned: z.number().min(0)
})

export type QuizAttemptInput = z.infer<typeof QuizAttemptSchema>
```

### 3.2 Database Operation with Validation

```typescript
// components/QuizInterface.tsx - Updated submitAnswer function
const submitAnswer = async () => {
  if (!selectedAnswer || !currentQuestion || !startTime) return
  
  setLoading(true)
  
  const endTime = new Date()
  const timeInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
  const correct = selectedAnswer === currentQuestion.correct_answer
  const xpEarned = calculateXP(correct, currentQuestion.difficulty_level, timeInSeconds)
  
  // Validate data before sending to database
  const attemptData = {
    user_id: user.id,
    subject_id: subject.id,
    question_id: currentQuestion.id,
    user_answer: selectedAnswer,
    correct_answer: currentQuestion.correct_answer,
    is_correct: correct,
    time_taken_seconds: timeInSeconds,
    xp_earned: xpEarned
  }
  
  try {
    // Validate the data structure
    const validatedData = QuizAttemptSchema.parse(attemptData)
    
    // Safe database operation
    const result = await safeDbOperation(
      () => supabase.from('quiz_attempts').insert(validatedData),
      null,
      'Failed to record quiz attempt'
    )
    
    if (!result) {
      // Show user-friendly error message
      setErrorMessage('Unable to save your answer. Your progress will be restored.')
      return
    }
    
    // Continue with progress update...
    
  } catch (validationError) {
    console.error('Data validation failed:', validationError)
    setErrorMessage('Invalid quiz data. Please refresh and try again.')
    return
  } finally {
    setLoading(false)
  }
}
```

## 4. Testing Strategy Implementation

### 4.1 Unit Testing Setup

```json
// package.json additions
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.4",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 4.2 Critical Test Cases

```typescript
// __tests__/QuizInterface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuizInterface from '@/components/QuizInterface'

describe('QuizInterface', () => {
  it('should handle database errors gracefully', async () => {
    // Mock Supabase to return error
    const mockSupabase = {
      from: () => ({
        insert: () => Promise.reject(new Error('Database error'))
      })
    }
    
    render(<QuizInterface {...mockProps} />)
    
    fireEvent.click(screen.getByText('Submit Answer'))
    
    await waitFor(() => {
      expect(screen.getByText(/unable to save your answer/i)).toBeInTheDocument()
    })
  })
  
  it('should prevent crashes when arrays are null', () => {
    const propsWithNullArrays = {
      ...mockProps,
      questions: null // This should not crash the app
    }
    
    expect(() => {
      render(<QuizInterface {...propsWithNullArrays} />)
    }).not.toThrow()
  })
})
```

## 5. Monitoring and Observability

### 5.1 Error Monitoring with Sentry

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function initializeMonitoring() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.user) {
        delete event.user.email
      }
      return event
    }
  })
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context })
}
```

### 5.2 Performance Monitoring

```typescript
// lib/performance.ts
export function measurePageLoad(pageName: string) {
  const startTime = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - startTime
      console.log(`${pageName} load time: ${duration}ms`)
      
      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_load_time', {
          event_category: 'Performance',
          event_label: pageName,
          value: Math.round(duration)
        })
      }
    }
  }
}
```

## 6. Development Workflow Improvements

### 6.1 Pre-commit Hooks

```json
// package.json
{
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.1.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 6.2 Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_ANALYTICS_ID=your_ga_id

# Database
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 7. Implementation Timeline

### Week 1: Critical Fixes (Production Stability)
- [ ] Fix database 400 errors
- [ ] Implement React Error Boundaries
- [ ] Add comprehensive type checking
- [ ] Deploy error monitoring

### Week 2: Quality Infrastructure
- [ ] Set up testing framework
- [ ] Add input validation with Zod
- [ ] Implement performance monitoring
- [ ] Create staging environment

### Week 3: Development Process
- [ ] Add pre-commit hooks
- [ ] Set up CI/CD pipeline
- [ ] Implement comprehensive test suite
- [ ] Add database migration system

## 8. Success Metrics

### Technical Health
- [ ] Zero unhandled runtime errors
- [ ] 95%+ uptime with monitoring
- [ ] <2s average page load time
- [ ] 80%+ test coverage

### Developer Experience
- [ ] All commits pass automated checks
- [ ] Issues detected in staging, not production
- [ ] Error root causes identified within 5 minutes
- [ ] New features developed with TDD

This specification provides a roadmap to transform the current MVP into a production-ready application with proper quality assurance practices.