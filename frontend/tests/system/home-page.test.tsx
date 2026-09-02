import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock api
jest.mock("@/lib/api", () => ({
  api: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    detail: string;
    constructor(status: number, detail: string) {
      super(detail);
      this.name = "ApiError";
      this.status = status;
      this.detail = detail;
    }
  },
}));

const mockApi = jest.requireMock("@/lib/api").api;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

import HomePage from "@/app/page";
import { AuthProvider } from "@/lib/auth-context";

const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
  card_id: null,
  is_blacklist: false,
  created_at: "2026-01-01",
};

const mockItems = {
  items: [
    { id: 1, name: "Arduino Uno", locker_number: "063", quantity: 5, is_active: true, image: null, enroll_status: null },
    { id: 2, name: "Raspberry Pi", locker_number: "077", quantity: 0, is_active: true, image: null, enroll_status: null },
    { id: 3, name: "ESP32 Board", locker_number: null, quantity: 3, is_active: true, image: null, enroll_status: "processing" as const },
  ],
  total: 3,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

beforeEach(() => {
  localStorageMock.clear();
  mockApi.mockReset();
  // Simulate authenticated user
  localStorageMock.getItem.mockReturnValue("test-token");
});

function renderHome() {
  // Set up api mock to handle both /api/auth/me and /api/items/
  mockApi.mockImplementation((path: string) => {
    if (path === "/api/auth/me") return Promise.resolve(mockUser);
    if (path.startsWith("/api/items/")) return Promise.resolve(mockItems);
    return Promise.resolve({});
  });

  return render(
    <AuthProvider>
      <HomePage />
    </AuthProvider>,
  );
}

describe("Home Page — System Test", () => {
  it("renders the welcome heading", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  it("renders item cards from API", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText("Arduino Uno")).toBeInTheDocument();
      expect(screen.getByText("Raspberry Pi")).toBeInTheDocument();
      expect(screen.getByText("ESP32 Board")).toBeInTheDocument();
    });
  });

  it("shows the locker number instead of the internal item ID", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText("Locker: 063")).toBeInTheDocument();
      expect(screen.queryByText("ID: 1")).not.toBeInTheDocument();
    });
  });

  it("shows quantity badge for items with quantity > 0", async () => {
    renderHome();

    await waitFor(() => {
      const badges = screen.getAllByText(/qty:\s*\d+/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows 'Out of Stock' badge for items with quantity 0", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    });
  });

  it("renders search input", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it("shows processing indicator for enrolling items", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });
});
