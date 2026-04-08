import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/login",
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
const { ApiError } = jest.requireMock("@/lib/api");

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

import LoginPage from "@/app/login/page";
import { AuthProvider } from "@/lib/auth-context";

beforeEach(() => {
  localStorageMock.clear();
  mockApi.mockReset();
  mockPush.mockReset();
  // Default: no saved token
  localStorageMock.getItem.mockReturnValue(null);
});

function renderLogin() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

describe("Login Page — System Test", () => {
  it("renders email and password fields", async () => {
    renderLogin();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    });
  });

  it("renders the sign in button", async () => {
    renderLogin();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it("shows error on invalid credentials", async () => {
    mockApi.mockRejectedValue(new ApiError(401, "Invalid email or password"));

    renderLogin();

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText("you@example.com"), "bad@test.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("has a link to the register page", async () => {
    renderLogin();

    await waitFor(() => {
      const link = screen.getByText(/register/i);
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "/register");
    });
  });
});
