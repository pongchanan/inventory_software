import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/context/AuthContext");
jest.mock("@/lib/api");
jest.mock("lucide-react", () => {
  const icon = (name: string) =>
    function MockIcon({ className }: any) {
      return <span data-testid={`icon-${name}`} className={className} />;
    };
  return {
    Users: icon("users"),
    Search: icon("search"),
    Filter: icon("filter"),
    MoreVertical: icon("more-vertical"),
    Shield: icon("shield"),
    User: icon("user"),
    CreditCard: icon("credit-card"),
    Mail: icon("mail"),
    Loader2: icon("loader2"),
    CheckCircle2: icon("check-circle2"),
    X: icon("x"),
    Package: icon("package"),
    Calendar: icon("calendar"),
    Check: icon("check"),
    Clock: icon("clock"),
    ChevronLeft: icon("chevron-left"),
    ChevronRight: icon("chevron-right"),
  };
});

import UsersAdminPage from "@/app/(protected)/admin/users/page";
import { useAuth } from "@/context/AuthContext";
import { fetchUsers, fetchUserBorrowings } from "@/lib/api";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFetchUsers = fetchUsers as jest.MockedFunction<typeof fetchUsers>;
const mockFetchUserBorrowings = fetchUserBorrowings as jest.MockedFunction<typeof fetchUserBorrowings>;

function adminAuth(overrides = {}) {
  return {
    user: {
      id: 1, uid: "admin1", name: "Admin User", email: "admin@test.com",
      role: "admin", authorized: true, created_at: "", updated_at: "",
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

const sampleUsers = [
  { id: 10, uid: "S001", name: "Alice Smith", email: "alice@test.com", role: "student", nfc_card_uid: "CARD-A" },
  { id: 11, uid: "S002", name: "Bob Jones", email: "bob@test.com", role: "student", nfc_card_uid: null },
  { id: 12, uid: "A001", name: "Admin Charlie", email: "charlie@test.com", role: "admin", nfc_card_uid: "CARD-C" },
];

const sampleHistory = [
  { id: 1, item_id: 5, item_name: "Multimeter", borrow_at: "2026-03-01T10:00:00Z", due_at: "2026-03-08T10:00:00Z", return_at: "2026-03-07T10:00:00Z", status: "returned" },
  { id: 2, item_id: 6, item_name: "Oscilloscope", borrow_at: "2026-04-01T10:00:00Z", due_at: "2026-04-08T10:00:00Z", return_at: null, status: "active" },
];

describe("UsersAdminPage", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseAuth.mockReturnValue(adminAuth());
    mockFetchUsers.mockResolvedValue(sampleUsers as any);
    mockFetchUserBorrowings.mockResolvedValue(sampleHistory as any);
    // Suppress React act() warnings from async state updates after waitFor resolves.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('not wrapped in act')) return;
      process.stderr.write(args.join(' ') + '\n');
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Auth guard", () => {
    it("returns null while auth is loading", () => {
      mockUseAuth.mockReturnValue(adminAuth({ loading: true, user: null }));
      const { container } = render(<UsersAdminPage />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for non-admin", () => {
      mockUseAuth.mockReturnValue(adminAuth({ isAdmin: false }));
      const { container } = render(<UsersAdminPage />);
      expect(container.firstChild).toBeNull();
    });

    it("redirects non-admin to login", () => {
      const replaceMock = jest.fn();
      jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ replace: replaceMock, push: jest.fn() });
      mockUseAuth.mockReturnValue(adminAuth({ isAdmin: false, loading: false }));
      render(<UsersAdminPage />);
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });

  describe("Page structure", () => {
    it("renders the page heading", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Manage Members")).toBeInTheDocument();
      });
    });

    it("renders the search input", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by name, student ID or email/i)).toBeInTheDocument();
      });
    });
  });

  describe("Data loading", () => {
    it("calls fetchUsers on mount", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalledTimes(1);
      });
    });

    it("renders all user names", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Jones")).toBeInTheDocument();
        expect(screen.getByText("Admin Charlie")).toBeInTheDocument();
      });
    });

    it("renders user emails", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("alice@test.com")).toBeInTheDocument();
      });
    });
  });

  describe("Role badges", () => {
    it("shows Admin badge for admin users", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Admin")).toBeInTheDocument();
      });
    });

    it("shows Student badge for student users", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        const studentBadges = screen.getAllByText("Student");
        expect(studentBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe("RFID card status", () => {
    it("shows RFID Mapped for users with a card linked", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        const rfidMapped = screen.getAllByText("RFID Mapped");
        expect(rfidMapped.length).toBeGreaterThan(0);
      });
    });

    it("shows No Card Linked for users without a card", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("No Card Linked")).toBeInTheDocument();
      });
    });
  });

  describe("Search filter", () => {
    it("filters users by name", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => screen.getByText("Alice Smith"));

      fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
        target: { value: "Alice" },
      });

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
    });

    it("filters users by email", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => screen.getByText("Alice Smith"));

      fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
        target: { value: "bob@test.com" },
      });

      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    });

    it("filters users by UID", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => screen.getByText("Alice Smith"));

      fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
        target: { value: "A001" },
      });

      expect(screen.getByText("Admin Charlie")).toBeInTheDocument();
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    });

    it("shows no users when query matches nothing", async () => {
      render(<UsersAdminPage />);
      await waitFor(() => screen.getByText("Alice Smith"));

      fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
        target: { value: "xyzzy-no-match" },
      });

      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
      expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
    });
  });

  describe("User history modal", () => {
    async function clickUser(name: string) {
      render(<UsersAdminPage />);
      await waitFor(() => screen.getByText(name));
      fireEvent.click(screen.getByText(name));
    }

    it("opens history modal when a user card is clicked", async () => {
      await clickUser("Alice Smith");
      await waitFor(() => {
        // The modal header shows the user's name again
        expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(1);
      });
    });

    it("calls fetchUserBorrowings with the user id", async () => {
      await clickUser("Alice Smith");
      await waitFor(() => {
        expect(mockFetchUserBorrowings).toHaveBeenCalledWith(10);
      });
    });

    it("renders borrowing history items in the modal", async () => {
      await clickUser("Alice Smith");
      await waitFor(() => {
        // Both desktop table and mobile card views render, so each name appears twice
        expect(screen.getAllByText("Multimeter").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Oscilloscope").length).toBeGreaterThan(0);
      });
    });

    it("shows Returned status for returned items", async () => {
      await clickUser("Alice Smith");
      await waitFor(() => {
        // "Returned" appears as a column header AND in both desktop/mobile status badges
        expect(screen.getAllByText("Returned").length).toBeGreaterThan(0);
      });
    });

    it("shows Active status for active borrowings", async () => {
      await clickUser("Alice Smith");
      await waitFor(() => {
        // Appears in both desktop table and mobile card status badges
        expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
      });
    });

    it("shows empty state when user has no borrowing history", async () => {
      mockFetchUserBorrowings.mockResolvedValue([]);
      await clickUser("Alice Smith");
      await waitFor(() => {
        expect(screen.getByText("No borrowing history")).toBeInTheDocument();
      });
    });

    it("closes modal when X button is clicked", async () => {
      await clickUser("Alice Smith");
      await waitFor(() => screen.getAllByText("Alice Smith"));

      const closeButton = screen.getByTestId("icon-x").closest("button")!;
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("No borrowing history")).not.toBeInTheDocument();
      });
    });
  });
});
