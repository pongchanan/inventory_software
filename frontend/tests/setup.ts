import "@testing-library/jest-dom";

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

// Mock next/link
jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
      ...rest
    }: {
      children: React.ReactNode;
      href: string;
      [key: string]: unknown;
    }) => {
      const React = require("react");
      return React.createElement("a", { href, ...rest }, children);
    },
  };
});

// Suppress console.error in tests unless debugging
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("act()")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
