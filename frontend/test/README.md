# Frontend Unit Tests

This directory contains unit tests for the Next.js frontend application.

## Setup

1. Install testing dependencies:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

Or if using the package.json in this directory:
```bash
cd test
npm install
cd ..
```

2. Make sure you're in the frontend directory.

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm test -- --watch
```

### Run tests with coverage:
```bash
npm test -- --coverage
```

### Run specific test file:
```bash
npm test ItemCard.test.tsx
```

### Run tests matching a pattern:
```bash
npm test -- --testNamePattern="renders item name"
```

## Test Structure

- **setup.ts**: Jest setup and global mocks
- **ItemCard.test.tsx**: Tests for ItemCard component
- **Navbar.test.tsx**: Tests for Navbar component
- **api.test.ts**: Tests for API client functions

## Test Coverage

Current test coverage includes:
- Component rendering
- User interactions
- API client functions
- Conditional rendering based on props
- Authentication context integration
- Router navigation
- Image handling

## Adding New Tests

1. Create a new test file following the naming convention `*.test.tsx` or `*.test.ts`
2. Import necessary testing utilities from `@testing-library/react`
3. Use descriptive test names that explain what is being tested
4. Follow the Arrange-Act-Assert pattern

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    // Arrange
    const props = { title: 'Test' }
    
    // Act
    render(<MyComponent {...props} />)
    
    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('handles click event', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Mocking

### Mocking Next.js features:
- `next/router` and `next/navigation` are mocked globally in setup.ts
- `next/image` is mocked to render a standard img tag

### Mocking API calls:
```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mock data' }),
})
```

### Mocking Context:
```typescript
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { name: 'Test User' },
    isAdmin: false,
  }),
}))
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the user sees and does
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Clean up after tests**: Use `beforeEach` and `afterEach` for setup/teardown
4. **Mock external dependencies**: Always mock API calls, router, etc.
5. **Write meaningful assertions**: Check for specific values, not just presence
6. **Test edge cases**: Include tests for empty states, errors, loading states

## CI/CD Integration

Add to your package.json scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

Example GitHub Actions workflow:
```yaml
- name: Run frontend tests
  run: |
    cd frontend
    npm ci
    npm run test:ci
```

## Troubleshooting

### Tests failing with "Cannot find module":
- Check that jest.config.ts has the correct moduleNameMapper
- Ensure all imports use the @ alias correctly

### React Testing Library errors:
- Make sure setup.ts is loaded (check setupFilesAfterEnv in jest.config.ts)
- Import from '@testing-library/react' not 'react-test-renderer'

### Mock not working:
- Place mocks before imports
- Use jest.clearAllMocks() in beforeEach
- Check mock implementation is correct
