# Frontend Tests

Jest test suite for the inventory software frontend. Tests are split into **unit** and **system** categories.

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run system tests only
npm run test:system

# Run with verbose output
npx jest --verbose

# Run a specific test file
npx jest tests/unit/api.test.ts
```

## Test Structure

```
tests/
├── setup.ts                          # Global setup — mocks & matchers
├── unit/                             # Pure unit tests
│   ├── api.test.ts                   # api() fetch wrapper
│   ├── auth-context.test.tsx         # AuthProvider & useAuth hook
│   └── pagination.test.tsx           # Pagination component
└── system/                           # System/integration tests
    ├── home-page.test.tsx            # Home page rendering & interactions
    └── login-flow.test.tsx           # Login page rendering & auth flow
```

## Unit Tests

### `api.test.ts` (10 tests)
Tests the `api()` fetch wrapper: GET requests, query parameter handling (null/undefined/empty filtering), auth headers, POST with JSON body, FormData without Content-Type, error handling via `ApiError`, status text fallback, non-JSON responses, and PATCH support.

### `auth-context.test.tsx` (7 tests)
Tests `AuthProvider` and `useAuth`: initial loading state, token hydration from localStorage, failed hydration cleanup, login flow, logout flow, `isAdmin` computed property, and `useAuth` outside provider error.

### `pagination.test.tsx` (10 tests)
Tests the `Pagination` component: returns null for single page, renders page buttons, highlights current page, click callbacks, disabled prev/next at boundaries, ellipsis rendering for large page counts, and first/last page visibility.

## System Tests

### `home-page.test.tsx` (6 tests)
Tests the Home page with mocked API: welcome heading, item card rendering, quantity badges, out-of-stock badge, search input, and processing indicator for enrolling items.

### `login-flow.test.tsx` (4 tests)
Tests the Login page: email/password fields, sign-in button, error display on invalid credentials, and register link.

## Setup

`tests/setup.ts` runs before all test suites and provides:

- **`@testing-library/jest-dom`** matchers (`.toBeInTheDocument()`, etc.)
- **`next/navigation`** mock — `useRouter`, `usePathname`, `useSearchParams`
- **`next/link`** mock — renders as a plain `<a>` tag
- **Console suppression** — filters noisy `act()` warnings

## Configuration

Jest is configured in `jest.config.ts`:

- **Environment:** jsdom
- **Transform:** ts-jest
- **Path alias:** `@/*` → `src/*`
- **Setup file:** `tests/setup.ts`
