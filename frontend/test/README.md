# Frontend Unit Tests

This directory contains unit tests for the Next.js frontend application.

**Current status: 171 tests passing across 10 test suites.**

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | 30 | Test runner |
| @testing-library/react | 16 | Component rendering |
| @testing-library/user-event | 14 | User interaction simulation |
| jest-environment-jsdom | — | Browser-like DOM environment |

## Setup

All dependencies are installed via the root `package.json` in `frontend/`. No extra install steps needed.

```bash
cd frontend
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run without coverage report (faster)
npm test -- --no-coverage

# Watch mode — re-runs on file save
npm test -- --watch

# Run with coverage report
npm test -- --coverage

# Run a specific test file by name
npx jest UsersAdminPage

# Run tests whose description matches a string
npx jest --testNamePattern="auth guard"
```

## Test File Map

```
test/
├── setup.ts                          # Global mocks (router, next/image, fetch)
│
├── api.test.ts                       # API client: fetchItemTypes, getImageUrl
├── ItemCard.test.tsx                 # ItemCard component: props, stock badge
├── Navbar.test.tsx                   # Navbar: links, logout, auth state
│
├── BorrowedPage.test.tsx             # Borrowed items page: render, filter, sort
├── ReportModal.test.tsx              # Damage report modal: form, upload, submit
├── useDamageReport.test.ts           # useDamageReport hook: state, validation, API
│
└── admin/
    ├── AdminDashboard.test.tsx       # Admin dashboard: stats, quick actions
    ├── DamagedReportsAdminPage.test.tsx  # Damage reports: filter, approve flow
    └── UsersAdminPage.test.tsx       # Users list: search, history modal
```

### Test counts by file

| File | Tests |
|------|------:|
| `api.test.ts` | 7 |
| `ItemCard.test.tsx` | 9 |
| `Navbar.test.tsx` | 10 |
| `BorrowedPage.test.tsx` | 22 |
| `ReportModal.test.tsx` | 20 |
| `useDamageReport.test.ts` | 27 |
| `admin/AdminDashboard.test.tsx` | 13 |
| `admin/DamagedReportsAdminPage.test.tsx` | 23 |
| `admin/UsersAdminPage.test.tsx` | 23 |
| `src/lib/api.test.ts` | 17 |
| **Total** | **171** |

## What Is Tested

### Auth guard pattern
Every protected page is tested for three cases:
- Returns `null` while `loading` is true
- Returns `null` (and doesn't render) when user is not admin
- Calls `router.replace("/login")` for unauthorized access

### Component tests
- Conditional rendering based on props and status values
- User interactions (clicks, form input, file upload)
- Loading and error states
- Search/filter logic

### Hook tests (`useDamageReport`)
- Initial state values
- `openReportModal` / `closeReportModal` / `clearError`
- `handleImageChange` — creates object URL, sets preview
- `handleRemoveImage` — revokes object URL, clears state
- `submitReport` — validates required fields, calls API, handles success and error

### API client tests (`api.test.ts`, `src/lib/api.test.ts`)
- `fetchItemTypes` calls the paginated `/api/items/` endpoint
- `getImageUrl` prepends the API base URL for relative paths
- CRUD stubs (`createItem`, `updateItem`, `deleteItem`) throw "not yet implemented in backend"

## Global Mocks (`setup.ts`)

| Mock | Behaviour |
|------|-----------|
| `next/navigation` (`useRouter`, `usePathname`) | Returns jest fns; `push`, `replace`, `back` are `jest.fn()` |
| `next/image` | Renders a plain `<img>` tag; strips Next.js-only props like `fill` |
| `global.fetch` | Set to `jest.fn()` — tests override this per file |

## Writing New Tests

1. Create `<Name>.test.tsx` (components) or `<Name>.test.ts` (hooks/utils) in the appropriate folder.
2. Import from `@testing-library/react` and `@testing-library/jest-dom`.
3. Mock external dependencies at the top of the file with `jest.mock(...)`.
4. Follow **Arrange → Act → Assert**.

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyComponent from "@/components/MyComponent";

jest.mock("@/context/AuthContext");
import { useAuth } from "@/context/AuthContext";
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("MyComponent", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { name: "Alice" }, isAdmin: false } as any);
  });

  it("renders the user name", () => {
    render(<MyComponent />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("calls onSubmit when form is submitted", async () => {
    const onSubmit = jest.fn();
    render(<MyComponent onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
```

## Common Patterns

### Admin page auth guard
```typescript
it("returns null for non-admin", () => {
  mockUseAuth.mockReturnValue({ user: { name: "Alice" }, isAdmin: false, loading: false } as any);
  const { container } = render(<AdminPage />);
  expect(container.firstChild).toBeNull();
});
```

### Mocking lucide-react icons
```typescript
jest.mock("lucide-react", () => {
  const icon = (name: string) =>
    function MockIcon({ className }: any) {
      return <span data-testid={`icon-${name}`} className={className} />;
    };
  return { AlertTriangle: icon("alert-triangle"), X: icon("x") /* ... */ };
});
```

### Async data loading
```typescript
it("renders data after fetch", async () => {
  mockFetchUsers.mockResolvedValue(sampleUsers);
  render(<UsersPage />);
  await waitFor(() => {
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
```

### Multiple elements with the same text
When a component renders both a desktop table and a mobile card view, the same text appears twice. Use `getAllByText` instead of `getByText`:
```typescript
expect(screen.getAllByText("Item Name").length).toBeGreaterThan(0);
```

## Troubleshooting

### "Cannot find module @/..."
Check that `jest.config.ts` has the correct `moduleNameMapper` for the `@/` alias pointing to `src/`.

### Module not found after adding a new mock
Place `jest.mock(...)` calls **before** any `import` statements that use the mocked module.

### `act(...)` warnings in async tests
Wrap state-triggering interactions in `await waitFor(...)` rather than asserting synchronously after `fireEvent`.

### `getByText` throws "Found multiple elements"
The page likely renders both a desktop and mobile view, duplicating the text. Use `getAllByText(...).length` or scope the query with `within(container)`.

### Tests pass locally but fail in CI
Run with `--no-coverage` locally to match CI behaviour, or ensure `NODE_ENV=test` is set.
