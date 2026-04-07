# Frontend Tests

This directory contains the test suite for the Next.js frontend, split into two categories:

- **Unit tests** (`test/unit/`) — test a single isolated piece (pure function, hook, leaf component)
- **System tests** (`test/system/`) — test full page/feature flows with the real component tree

**Current status: 171 tests passing across 10 test suites (45 unit + 126 system).**

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | 30 | Test runner |
| @testing-library/react | 16 | Component rendering |
| @testing-library/user-event | 14 | User interaction simulation |
| jest-environment-jsdom | — | Browser-like DOM environment |

## Setup

All dependencies are installed via `frontend/package.json`. No extra steps needed.

```bash
cd frontend
npm install
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only (fast, no external deps)
npm run test:unit

# Run system tests only (pages + admin flows)
npm run test:system

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
├── setup.ts                               # Global mocks (router, next/image, fetch)
│
├── unit/                                  # 45 tests — isolated units
│   ├── api.test.ts                        # API client: fetchItems, getImageUrl, CRUD stubs
│   ├── ItemCard.test.tsx                  # ItemCard component: props, stock badge
│   └── useDamageReport.test.ts            # useDamageReport hook: state, validation, API
│
└── system/                                # 126 tests — full page / feature flows
    ├── BorrowedPage.test.tsx              # Borrowed items page: render, filter, sort
    ├── Navbar.test.tsx                    # Navbar: links, logout, auth state
    ├── ReportModal.test.tsx               # Damage report modal: form, upload, submit
    └── admin/
        ├── AdminDashboard.test.tsx        # Admin dashboard: stats, quick actions
        ├── DamagedReportsAdminPage.test.tsx  # Damage reports: filter, approve flow
        └── UsersAdminPage.test.tsx        # Users list: search, history modal
```

Also covered by the unit suite:

```
src/lib/api.test.ts    # Additional API contract tests (co-located with source)
```

### Test counts by file

| Suite | File | Tests |
|-------|------|------:|
| unit | `unit/api.test.ts` | 7 |
| unit | `unit/ItemCard.test.tsx` | 9 |
| unit | `unit/useDamageReport.test.ts` | 27 |
| unit | `src/lib/api.test.ts` | 17 |
| system | `system/Navbar.test.tsx` | 10 |
| system | `system/ReportModal.test.tsx` | 20 |
| system | `system/BorrowedPage.test.tsx` | 22 |
| system | `system/admin/AdminDashboard.test.tsx` | 13 |
| system | `system/admin/DamagedReportsAdminPage.test.tsx` | 23 |
| system | `system/admin/UsersAdminPage.test.tsx` | 23 |
| | **Total** | **171** |

## What Is Tested

### Unit tests
- **`api.test.ts`** — `fetchItems` calls the paginated `/api/items/` endpoint; `getImageUrl` prepends the API base URL for relative paths; CRUD stubs throw "not yet implemented in backend"
- **`ItemCard.test.tsx`** — renders item name, availability count, "Out of Stock" state, click handler
- **`useDamageReport.test.ts`** — initial state, `openReportModal` / `closeReportModal` / `clearError`, `handleImageChange` (creates object URL), `handleRemoveImage` (revokes URL), `submitReport` validation, API success and error paths

### System tests
- **Auth guard pattern** — every protected page is tested for: returns `null` while loading, returns `null` for non-admin, calls `router.replace("/login")`
- **BorrowedPage** — renders borrowed items, Report Damage button hidden for `damage_reported`/`damage_approved` status, search, sort, filter, modal open/close
- **Navbar** — active link highlight, logout action, authenticated vs unauthenticated states
- **ReportModal** — form content, error display, submit button states, image upload/preview/removal, Cancel/Submit interactions
- **AdminDashboard** — stats cards, welcome message, Export Excel button, System Online indicator, quick action links, error resilience
- **DamagedReportsAdminPage** — fetch on mount, Pending/Approved/All filter tabs, Review & Approve button, approval modal submit/cancel, post-approval state update
- **UsersAdminPage** — user grid, role badges, RFID status, search by name/email/UID, user history modal, "No borrowing history" empty state, close modal

## Global Mocks (`setup.ts`)

| Mock | Behaviour |
|------|-----------|
| `next/navigation` (`useRouter`, `usePathname`) | Returns jest fns; `push`, `replace`, `back` are `jest.fn()` |
| `next/image` | Renders a plain `<img>` tag; strips all Next.js-only props (`fill`, `unoptimized`, `priority`, etc.) |
| `global.fetch` | Set to `jest.fn()` — each test file overrides per-test |

## Writing New Tests

**Unit test** — place in `test/unit/`, mock all imports, test one thing:
```typescript
// test/unit/myUtil.test.ts
import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("returns formatted string", () => {
    expect(formatDate("2026-04-07T00:00:00Z")).toBe("Apr 7, 2026");
  });
});
```

**System test** — place in `test/system/`, mock context/API only, render the real component:
```typescript
// test/system/MyPage.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/context/AuthContext");
jest.mock("@/lib/api");

import MyPage from "@/app/(protected)/mypage/page";
import { useAuth } from "@/context/AuthContext";
import { fetchData } from "@/lib/api";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFetchData = fetchData as jest.MockedFunction<typeof fetchData>;

describe("MyPage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseAuth.mockReturnValue({ user: { name: "Alice" }, isAdmin: false, loading: false } as any);
    mockFetchData.mockResolvedValue([]);
  });

  it("renders the heading", async () => {
    render(<MyPage />);
    await waitFor(() => expect(screen.getByText("My Page")).toBeInTheDocument());
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

### Suppressing expected console.error noise
When testing error-path behavior, suppress the component's own `console.error` so it doesn't pollute test output:
```typescript
let consoleErrorSpy: jest.SpyInstance;
beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((...args) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("Expected error text")) return;
    process.stderr.write(args.join(" ") + "\n");
  });
});
afterEach(() => { consoleErrorSpy.mockRestore(); });
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

