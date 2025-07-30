# Testing Best Practices Guide

Last updated: 2025-01-26

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Component Testing](#component-testing)
- [Hook Testing](#hook-testing)
- [Context Testing](#context-testing)
- [Service Testing](#service-testing)
- [Mocking](#mocking)
- [Code Coverage](#code-coverage)
- [CI/CD Integration](#cicd-integration)

## Overview

This project uses **Vitest** as the testing framework with **React Testing Library** for component testing. Our goal is to maintain at least 80% code coverage across all critical code paths.

### Key Principles

1. **Test behavior, not implementation** - Focus on what the component does, not how
2. **Write tests that resemble how users interact** - Click buttons, fill forms, etc.
3. **Keep tests isolated** - Each test should be independent
4. **Use meaningful test descriptions** - Tests should document expected behavior
5. **Maintain test data separately** - Use fixtures and factories for test data

## Test Structure

### File Organization

```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── hooks/
│   ├── useDebounce.ts
│   └── __tests__/
│       └── useDebounce.test.ts
├── utils/
│   ├── cn.ts
│   └── __tests__/
│       └── cn.test.ts
└── test/
    ├── setup.ts
    ├── utils.tsx
    └── mocks/
```

### Test File Naming

- Unit tests: `[component-name].test.tsx` or `[function-name].test.ts`
- Integration tests: `[feature-name].integration.test.tsx`
- E2E tests: `[user-flow].e2e.test.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Watch mode with coverage
npm run test:coverage:watch

# Generate and open coverage report
npm run test:coverage:report

# Run E2E tests
npm run test:e2e
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  describe('feature or behavior', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### AAA Pattern

Always follow the **Arrange-Act-Assert** pattern:

```typescript
it('should update count when button is clicked', () => {
  // Arrange
  const { getByRole } = render(<Counter initialCount={0} />)
  const button = getByRole('button')
  
  // Act
  fireEvent.click(button)
  
  // Assert
  expect(getByRole('heading')).toHaveTextContent('Count: 1')
})
```

## Component Testing

### Basic Component Test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing with Router

```typescript
import { BrowserRouter } from 'react-router-dom'

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

it('renders link with correct href', () => {
  renderWithRouter(<NavLink href="/about">About</NavLink>)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/about')
})
```

### Testing Async Components

```typescript
import { waitFor } from '@testing-library/react'

it('loads and displays data', async () => {
  render(<UserProfile userId="123" />)
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

## Hook Testing

### Basic Hook Test

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '../useCounter'

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter())
    
    expect(result.current.count).toBe(0)
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
})
```

### Testing Hooks with Dependencies

```typescript
it('updates when props change', () => {
  const { result, rerender } = renderHook(
    ({ delay }) => useDebounce('value', delay),
    { initialProps: { delay: 500 } }
  )
  
  // Change props
  rerender({ delay: 1000 })
  
  // Test behavior with new props
})
```

## Context Testing

### Testing Context Providers

```typescript
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

describe('ThemeContext', () => {
  it('provides theme value and toggle function', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })
})
```

## Service Testing

### Testing Services and Utilities

```typescript
describe('NotificationService', () => {
  const mockAddNotification = vi.fn()
  
  beforeEach(() => {
    notificationService.setHandlers(mockAddNotification, vi.fn())
  })
  
  it('calls handler with correct parameters', () => {
    notificationService.success('Title', 'Message')
    
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'success',
      title: 'Title',
      message: 'Message'
    })
  })
})
```

## Mocking

### Mocking Modules

```typescript
vi.mock('@/services/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test User' })
}))
```

### Mocking Browser APIs

```typescript
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

### Using MSW for API Mocking

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('/api/user/:id', (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, name: 'Test User' }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Code Coverage

### Configuration

Our Vitest configuration sets the following coverage thresholds:

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Coverage Reports

- **Text Report**: Displayed in terminal after test run
- **HTML Report**: Interactive report at `coverage/index.html`
- **LCOV Report**: For CI integration at `coverage/lcov.info`

### Improving Coverage

1. **Identify gaps**: Run `npm run test:coverage` to see uncovered code
2. **Focus on critical paths**: Prioritize business logic and user flows
3. **Test edge cases**: Include error states and boundary conditions
4. **Avoid testing implementation details**: Focus on behavior

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run test -- --run --reporter=dot
```

## Best Practices Summary

### DO:
- ✅ Test user-visible behavior
- ✅ Use semantic queries (getByRole, getByLabelText)
- ✅ Test error states and edge cases
- ✅ Keep tests simple and focused
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Test accessibility features

### DON'T:
- ❌ Test implementation details
- ❌ Use arbitrary test IDs when semantic queries work
- ❌ Write brittle tests that break with refactoring
- ❌ Test third-party libraries
- ❌ Ignore console errors in tests
- ❌ Leave commented-out tests

## Common Testing Patterns

### Testing Forms

```typescript
it('submits form with valid data', async () => {
  const onSubmit = vi.fn()
  render(<ContactForm onSubmit={onSubmit} />)
  
  await userEvent.type(screen.getByLabelText('Name'), 'John Doe')
  await userEvent.type(screen.getByLabelText('Email'), 'john@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
  
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com'
  })
})
```

### Testing Loading States

```typescript
it('shows loading state while fetching', async () => {
  render(<UserList />)
  
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
})
```

### Testing Error Handling

```typescript
it('displays error message on failure', async () => {
  server.use(
    rest.get('/api/users', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }))
    })
  )
  
  render(<UserList />)
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load users')).toBeInTheDocument()
  })
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [MSW Documentation](https://mswjs.io/)

## Continuous Improvement

This guide is a living document. As we discover new patterns or encounter testing challenges, we should update this guide to reflect our learnings and maintain consistency across the codebase.