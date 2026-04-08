import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/context/AuthContext");
jest.mock("@/lib/api");
jest.mock("@/lib/api_client/audit");
jest.mock("recharts", () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Tooltip: () => <div />,
}));
jest.mock("xlsx", () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
    aoa_to_sheet: jest.fn(() => ({})),
    encode_col: jest.fn(() => "A"),
  },
  writeFile: jest.fn(),
}));
jest.mock("lucide-react", () => {
  const icon = (name: string) =>
    function MockIcon() {
      return <span data-testid={`icon-${name}`} />;
    };
  return {
    LayoutDashboard: icon("layout-dashboard"),
    Package: icon("package"),
    Cpu: icon("cpu"),
    Wrench: icon("wrench"),
    Users: icon("users"),
    FileText: icon("file-text"),
    TrendingUp: icon("trending-up"),
    AlertCircle: icon("alert-circle"),
    CheckCircle2: icon("check-circle2"),
    Clock: icon("clock"),
    ArrowRight: icon("arrow-right"),
    ShieldCheck: icon("shield-check"),
    Download: icon("download"),
  };
});

import AdminDashboard from "@/app/(protected)/admin/page";
import { useAuth } from "@/context/AuthContext";
import { fetchItems, fetchMostBorrowedItems, fetchMostDamagedItems } from "@/lib/api";
import { fetchCabinetAccessLogs } from "@/lib/api_client/audit";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFetchItems = fetchItems as jest.MockedFunction<typeof fetchItems>;
const mockFetchMostBorrowedItems = fetchMostBorrowedItems as jest.MockedFunction<typeof fetchMostBorrowedItems>;
const mockFetchMostDamagedItems = fetchMostDamagedItems as jest.MockedFunction<typeof fetchMostDamagedItems>;
const mockFetchCabinetAccessLogs = fetchCabinetAccessLogs as jest.MockedFunction<typeof fetchCabinetAccessLogs>;

function adminAuth(overrides = {}) {
  return {
    user: {
      id: 1,
      uid: "admin1",
      name: "Admin User",
      email: "admin@test.com",
      role: "admin",
      authorized: true,
      created_at: "",
      updated_at: "",
    },
    token: "admin-token",
    isAdmin: true,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    ...overrides,
  } as any;
}

const sampleItems = [
  { id: 1, uid: "TYPE-1", name: "Item 1", description: null, category: "item-type", quantity: 5, available: true, location: null, image_url: null, created_at: "", updated_at: "" },
  { id: 2, uid: "TYPE-2", name: "Item 2", description: null, category: "item-type", quantity: 3, available: true, location: null, image_url: null, created_at: "", updated_at: "" },
];

describe("AdminDashboard", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseAuth.mockReturnValue(adminAuth());
    mockFetchItems.mockResolvedValue(sampleItems as any);
    mockFetchMostBorrowedItems.mockResolvedValue([]);
    mockFetchMostDamagedItems.mockResolvedValue([]);
    mockFetchCabinetAccessLogs.mockResolvedValue({ logs: [], total: 0 } as any);
    // Suppress React act() warnings from background async effects and
    // expected component error logs from error-path tests.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('not wrapped in act') || msg.includes('Failed to load dashboard stats')) return;
      process.stderr.write(args.join(' ') + '\n');
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Auth guard", () => {
    it("returns null while auth is loading", () => {
      mockUseAuth.mockReturnValue(adminAuth({ loading: true, user: null }));
      const { container } = render(<AdminDashboard />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for non-admin user", () => {
      mockUseAuth.mockReturnValue(adminAuth({ isAdmin: false }));
      const { container } = render(<AdminDashboard />);
      expect(container.firstChild).toBeNull();
    });

    it("redirects non-admin to login", () => {
      const replaceMock = jest.fn();
      jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ replace: replaceMock, push: jest.fn() });
      mockUseAuth.mockReturnValue(adminAuth({ isAdmin: false, loading: false }));
      render(<AdminDashboard />);
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });

  describe("Page structure", () => {
    it("renders the dashboard heading", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("System Control Center")).toBeInTheDocument();
      });
    });

    it("displays welcome message with admin name", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Welcome Admin User/)).toBeInTheDocument();
      });
    });

    it("renders the Export Excel button", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Export Excel/i })).toBeInTheDocument();
      });
    });

    it("renders System Online indicator", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("System Online")).toBeInTheDocument();
      });
    });
  });

  describe("Stats", () => {
    it("shows total equipment count from fetched items", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("calls fetchItems on mount", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalledTimes(1);
      });
    });

    it("calls fetchMostBorrowedItems on mount", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(mockFetchMostBorrowedItems).toHaveBeenCalledWith(5);
      });
    });

    it("calls fetchMostDamagedItems on mount", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(mockFetchMostDamagedItems).toHaveBeenCalledWith(5);
      });
    });
  });

  describe("Quick actions", () => {
    it("renders Manage Equipment quick action link", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("Manage Equipment")).toBeInTheDocument();
      });
    });

    it("renders Damage Reports quick action link", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("Damage Reports")).toBeInTheDocument();
      });
    });

    it("renders Manage Members quick action link", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("Manage Members")).toBeInTheDocument();
      });
    });

    it("renders Loans & Maintenance quick action link", async () => {
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("Loans & Maintenance")).toBeInTheDocument();
      });
    });
  });

  describe("Error resilience", () => {
    it("still renders after fetchItems fails", async () => {
      mockFetchItems.mockRejectedValue(new Error("API error"));
      render(<AdminDashboard />);
      await waitFor(() => {
        expect(screen.getByText("System Control Center")).toBeInTheDocument();
      });
    });
  });
});
