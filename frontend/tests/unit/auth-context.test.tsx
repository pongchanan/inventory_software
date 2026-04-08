import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

// Mock the api module
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

// Test component that exposes auth state
function TestConsumer() {
  const { user, token, loading, isAdmin, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.name : "null"}</span>
      <span data-testid="token">{token ?? "null"}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <button
        data-testid="login"
        onClick={() => login("test@example.com", "pass")}
      />
      <button data-testid="logout" onClick={logout} />
    </div>
  );
}

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

beforeEach(() => {
  localStorageMock.clear();
  mockApi.mockReset();
  jest.clearAllMocks();
});

describe("AuthProvider", () => {
  it("starts with loading=true, user=null", () => {
    // No saved token
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("null");
  });

  it("hydrates user from saved token on mount", async () => {
    localStorageMock.getItem.mockReturnValue("saved-token");
    mockApi.mockResolvedValue({
      id: 1,
      name: "John",
      email: "john@test.com",
      role: "user",
      card_id: null,
      is_blacklist: false,
      created_at: "2026-01-01",
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    expect(screen.getByTestId("user").textContent).toBe("John");
    expect(screen.getByTestId("isAdmin").textContent).toBe("false");
  });

  it("clears token if hydration fails", async () => {
    localStorageMock.getItem.mockReturnValue("bad-token");
    mockApi.mockRejectedValue(new Error("401"));

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("inv_token");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("login stores token and sets user", async () => {
    localStorageMock.getItem.mockReturnValue(null);
    mockApi.mockResolvedValue({
      access_token: "new-token",
      token_type: "bearer",
      user: {
        id: 2,
        name: "Admin",
        email: "admin@test.com",
        role: "admin",
        card_id: "CARD1",
        is_blacklist: false,
        created_at: "2026-01-01",
      },
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("login"));
    });

    expect(screen.getByTestId("user").textContent).toBe("Admin");
    expect(screen.getByTestId("token").textContent).toBe("new-token");
    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("inv_token", "new-token");
  });

  it("logout clears token and user", async () => {
    localStorageMock.getItem.mockReturnValue("saved-token");
    mockApi.mockResolvedValue({
      id: 1,
      name: "John",
      email: "john@test.com",
      role: "user",
      card_id: null,
      is_blacklist: false,
      created_at: "2026-01-01",
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("logout"));
    });

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("inv_token");
  });

  it("isAdmin is true only for admin role", async () => {
    localStorageMock.getItem.mockReturnValue("admin-token");
    mockApi.mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      card_id: null,
      is_blacklist: false,
      created_at: "2026-01-01",
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
    });

    expect(screen.getByTestId("isAdmin").textContent).toBe("true");
  });
});

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress error boundary console output
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be inside AuthProvider",
    );

    spy.mockRestore();
  });
});
