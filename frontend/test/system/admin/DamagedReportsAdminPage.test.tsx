import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/context/AuthContext");
jest.mock("@/lib/api_client/damaged_reports");
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
    AlertTriangle: icon("alert-triangle"),
    CheckCircle2: icon("check-circle2"),
    Clock: icon("clock"),
    X: icon("x"),
    Loader2: icon("loader2"),
    MessageSquare: icon("message-square"),
    Eye: icon("eye"),
    Download: icon("download"),
  };
});

import DamagedReportsAdminPage from "@/app/(protected)/admin/damaged-reports/page";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAllDamageReports,
  approveDamageReport,
  DamagedItemReportOut,
} from "@/lib/api_client/damaged_reports";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFetchAllDamageReports = fetchAllDamageReports as jest.MockedFunction<typeof fetchAllDamageReports>;
const mockApproveDamageReport = approveDamageReport as jest.MockedFunction<typeof approveDamageReport>;

function adminAuth(overrides = {}) {
  return {
    user: { id: 1, uid: "admin1", name: "Admin User", email: "admin@test.com", role: "admin", authorized: true, created_at: "", updated_at: "" },
    token: "admin-token",
    isAdmin: true,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    ...overrides,
  } as any;
}

const sampleReports: DamagedItemReportOut[] = [
  {
    id: 1,
    user_id: 10,
    item_id: 5,
    topic: "Broken Screen",
    description: "Screen cracked",
    illustrated_path: "",
    report_at: "2026-04-01T10:00:00Z",
    report_by: 10,
    approved: false,
    user: { id: 10, name: "Alice" },
    item: { id: 5, name: "Multimeter" },
  },
  {
    id: 2,
    user_id: 11,
    item_id: 6,
    topic: "Burnt Board",
    description: "Board is burned",
    illustrated_path: "",
    report_at: "2026-04-02T10:00:00Z",
    report_by: 11,
    approved: true,
    admin_comment: "Confirmed",
    user: { id: 11, name: "Bob" },
    item: { id: 6, name: "Oscilloscope" },
  },
];

describe("DamagedReportsAdminPage", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    mockUseAuth.mockReturnValue(adminAuth());
    mockFetchAllDamageReports.mockResolvedValue(sampleReports);
    // Suppress expected component error logs from error-path tests.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('Failed to load damage reports:') || msg.includes('not wrapped in act')) return;
      process.stderr.write(args.join(' ') + '\n');
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Auth guard", () => {
    it("returns null while auth is loading", () => {
      mockUseAuth.mockReturnValue(adminAuth({ loading: true, user: null }));
      const { container } = render(<DamagedReportsAdminPage />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when user is not admin", () => {
      mockUseAuth.mockReturnValue(adminAuth({ isAdmin: false }));
      const { container } = render(<DamagedReportsAdminPage />);
      expect(container.firstChild).toBeNull();
    });

    it("redirects non-admin to login", () => {
      const replaceMock = jest.fn();
      jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ replace: replaceMock, push: jest.fn() });
      mockUseAuth.mockReturnValue(adminAuth({ isAdmin: false, loading: false }));
      render(<DamagedReportsAdminPage />);
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });

  describe("Page structure", () => {
    it("renders the page heading", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Damage Reports")).toBeInTheDocument();
      });
    });

    it("renders Export Excel button", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Export Excel/i })).toBeInTheDocument();
      });
    });
  });

  describe("Data loading", () => {
    it("calls fetchAllDamageReports on mount", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(mockFetchAllDamageReports).toHaveBeenCalledTimes(1);
      });
    });

    it("renders report topics after loading", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Broken Screen")).toBeInTheDocument();
        expect(screen.getByText("Burnt Board")).toBeInTheDocument();
      });
    });

    it("renders reporter and item names", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByText(/Alice/)).toBeInTheDocument();
        expect(screen.getByText(/Multimeter/)).toBeInTheDocument();
      });
    });

    it("shows error message on fetch failure", async () => {
      mockFetchAllDamageReports.mockRejectedValue(new Error("Network error"));
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe("Stats cards", () => {
    it("shows total report count", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Total Reports")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("shows pending count", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Pending Review")).toBeInTheDocument();
        // 1 pending report
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });
  });

  describe("Status filter", () => {
    it("filters to show only pending reports", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => screen.getByText("Broken Screen"));

      fireEvent.click(screen.getByRole("button", { name: /^Pending$/i }));

      expect(screen.getByText("Broken Screen")).toBeInTheDocument();
      expect(screen.queryByText("Burnt Board")).not.toBeInTheDocument();
    });

    it("filters to show only approved reports", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => screen.getByText("Burnt Board"));

      fireEvent.click(screen.getByRole("button", { name: /^Approved$/i }));

      expect(screen.getByText("Burnt Board")).toBeInTheDocument();
      expect(screen.queryByText("Broken Screen")).not.toBeInTheDocument();
    });

    it("shows all reports when All filter is selected", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => screen.getByText("Broken Screen"));

      // Select Pending first then revert to All
      fireEvent.click(screen.getByRole("button", { name: /^Pending$/i }));
      fireEvent.click(screen.getByRole("button", { name: /All Reports/i }));

      expect(screen.getByText("Broken Screen")).toBeInTheDocument();
      expect(screen.getByText("Burnt Board")).toBeInTheDocument();
    });
  });

  describe("Review & Approve button", () => {
    it("shows Review & Approve button for pending reports", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Review & Approve/i })).toBeInTheDocument();
      });
    });

    it("does not show Review & Approve button for already approved reports", async () => {
      mockFetchAllDamageReports.mockResolvedValue([sampleReports[1]]); // approved only
      render(<DamagedReportsAdminPage />);
      await waitFor(() => screen.getByText("Burnt Board"));
      expect(screen.queryByRole("button", { name: /Review & Approve/i })).not.toBeInTheDocument();
    });

    it("opens ApprovalModal when Review & Approve is clicked", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => screen.getByRole("button", { name: /Review & Approve/i }));
      fireEvent.click(screen.getByRole("button", { name: /Review & Approve/i }));
      expect(screen.getByText("Add Admin Assessment")).toBeInTheDocument();
    });
  });

  describe("ApprovalModal", () => {
    async function openModal() {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => screen.getByRole("button", { name: /Review & Approve/i }));
      fireEvent.click(screen.getByRole("button", { name: /Review & Approve/i }));
    }

    it("displays the report topic inside the modal", async () => {
      await openModal();
      // Topic appears in both the card below and inside the modal
      expect(screen.getAllByText("Broken Screen").length).toBeGreaterThan(1);
    });

    it("displays the report description inside the modal", async () => {
      await openModal();
      // Description appears in both the card below and inside the modal
      expect(screen.getAllByText("Screen cracked").length).toBeGreaterThan(1);
    });

    it("closes modal when Cancel is clicked", async () => {
      await openModal();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(screen.queryByText("Add Admin Assessment")).not.toBeInTheDocument();
    });

    it("calls approveDamageReport with id and comment on submit", async () => {
      mockApproveDamageReport.mockResolvedValue({ ...sampleReports[0], approved: true });
      await openModal();

      fireEvent.change(screen.getByPlaceholderText(/Enter your assessment/i), {
        target: { value: "Confirmed damage" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }));

      await waitFor(() => {
        expect(mockApproveDamageReport).toHaveBeenCalledWith(1, "Confirmed damage");
      });
    });

    it("approves with empty comment when no comment entered", async () => {
      mockApproveDamageReport.mockResolvedValue({ ...sampleReports[0], approved: true });
      await openModal();
      fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }));
      await waitFor(() => {
        expect(mockApproveDamageReport).toHaveBeenCalledWith(1, "");
      });
    });

    it("closes modal after successful approval", async () => {
      mockApproveDamageReport.mockResolvedValue({ ...sampleReports[0], approved: true });
      await openModal();
      fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }));
      await waitFor(() => {
        expect(screen.queryByText("Add Admin Assessment")).not.toBeInTheDocument();
      });
    });

    it("updates report status to Approved in the list after approval", async () => {
      mockApproveDamageReport.mockResolvedValue({ ...sampleReports[0], approved: true });
      await openModal();
      fireEvent.click(screen.getByRole("button", { name: /^Approve$/i }));
      await waitFor(() => {
        // "Review & Approve" button should be gone for the now-approved report
        expect(screen.queryByRole("button", { name: /Review & Approve/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("Admin comment display", () => {
    it("shows admin comment when present on a report", async () => {
      render(<DamagedReportsAdminPage />);
      await waitFor(() => {
        expect(screen.getByText("Confirmed")).toBeInTheDocument();
        expect(screen.getByText("Admin Assessment")).toBeInTheDocument();
      });
    });
  });
});
