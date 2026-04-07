import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mocks must be declared before imports of the mocked modules
jest.mock("@/services/hooks/useInventory");
jest.mock("@/services/hooks/useDamageReport");
jest.mock("@/context/AuthContext");

jest.mock("lucide-react", () => ({
  Package: () => <span />,
  History: () => <span />,
  AlertTriangle: () => <span />,
  Search: () => <span />,
  Filter: () => <span />,
}));

jest.mock("@/components/features/ReportModal", () => ({
  ReportModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="report-modal" /> : null,
}));

import BorrowedPage from "@/app/(protected)/borrowed/page";
import { useInventory } from "@/services/hooks/useInventory";
import { useDamageReport } from "@/services/hooks/useDamageReport";
import { useAuth } from "@/context/AuthContext";
import { BorrowedItem } from "@/domain/models/Item";

const mockUseInventory = useInventory as jest.MockedFunction<typeof useInventory>;
const mockUseDamageReport = useDamageReport as jest.MockedFunction<typeof useDamageReport>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function makeDamageReportMock(overrides: Partial<ReturnType<typeof useDamageReport>> = {}) {
  return {
    isReportModalOpen: false,
    selectedItem: null,
    reportImagePreview: null,
    reportDetail: "",
    setReportDetail: jest.fn(),
    isSubmitting: false,
    error: null,
    openReportModal: jest.fn(),
    closeReportModal: jest.fn(),
    handleImageChange: jest.fn(),
    handleRemoveImage: jest.fn(),
    clearError: jest.fn(),
    submitReport: jest.fn(),
    ...overrides,
  };
}

function makeAuthMock(overrides = {}) {
  return {
    user: { id: "1", name: "Test User", studentId: "S001", initial: "TU" },
    token: "mock-token",
    isAdmin: false,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    ...overrides,
  };
}

const sampleBorrowedItems: BorrowedItem[] = [
  { id: 1, name: "Multimeter", date: "1 Apr 26", img: "", status: "active" },
  { id: 2, name: "Oscilloscope", date: "2 Apr 26", img: "", status: "damage_reported" },
  { id: 3, name: "Soldering Iron", date: "3 Apr 26", img: "", status: "damage_approved" },
];

describe("BorrowedPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(makeAuthMock() as any);
    mockUseDamageReport.mockReturnValue(makeDamageReportMock());
  });

  describe("Authentication", () => {
    it("returns null while auth is loading", () => {
      mockUseAuth.mockReturnValue(makeAuthMock({ loading: true, user: null }) as any);
      mockUseInventory.mockReturnValue({ borrowedItems: [] } as any);
      const { container } = render(<BorrowedPage />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when user is not authenticated", () => {
      mockUseAuth.mockReturnValue(makeAuthMock({ user: null, loading: false }) as any);
      mockUseInventory.mockReturnValue({ borrowedItems: [] } as any);
      const { container } = render(<BorrowedPage />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Rendering", () => {
    it("renders the page heading", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: [] } as any);
      render(<BorrowedPage />);
      expect(screen.getByText("My Borrowed Items")).toBeInTheDocument();
    });

    it("renders all borrowed item names", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      expect(screen.getByText("Multimeter")).toBeInTheDocument();
      expect(screen.getByText("Oscilloscope")).toBeInTheDocument();
      expect(screen.getByText("Soldering Iron")).toBeInTheDocument();
    });

    it("renders the borrow date for each item", () => {
      mockUseInventory.mockReturnValue({
        borrowedItems: [{ id: 1, name: "Multimeter", date: "1 Apr 26", img: "", status: "active" }],
      } as any);
      render(<BorrowedPage />);
      expect(screen.getByText(/Borrowed on 1 Apr 26/)).toBeInTheDocument();
    });

    it("shows empty state message when no items are borrowed", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: [] } as any);
      render(<BorrowedPage />);
      expect(
        screen.getByText("You haven't borrowed any equipment yet")
      ).toBeInTheDocument();
    });

    it("renders the search input", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: [] } as any);
      render(<BorrowedPage />);
      expect(screen.getByPlaceholderText("Search borrowed items...")).toBeInTheDocument();
    });
  });

  describe("Report Damage button", () => {
    it("is enabled for items with active status", () => {
      mockUseInventory.mockReturnValue({
        borrowedItems: [{ id: 1, name: "Multimeter", date: "1 Apr 26", img: "", status: "active" }],
      } as any);
      render(<BorrowedPage />);
      const button = screen.getByRole("button", { name: /Report Damage/i });
      expect(button).not.toBeDisabled();
    });

    it("is disabled for items with damage_reported status", () => {
      mockUseInventory.mockReturnValue({
        borrowedItems: [{ id: 2, name: "Oscilloscope", date: "2 Apr 26", img: "", status: "damage_reported" }],
      } as any);
      render(<BorrowedPage />);
      const button = screen.getByRole("button", { name: /Report Damage/i });
      expect(button).toBeDisabled();
    });

    it("is disabled for items with damage_approved status", () => {
      mockUseInventory.mockReturnValue({
        borrowedItems: [{ id: 3, name: "Soldering Iron", date: "3 Apr 26", img: "", status: "damage_approved" }],
      } as any);
      render(<BorrowedPage />);
      const button = screen.getByRole("button", { name: /Report Damage/i });
      expect(button).toBeDisabled();
    });

    it("calls openReportModal with the item when clicked", () => {
      const openReportModal = jest.fn();
      mockUseDamageReport.mockReturnValue(makeDamageReportMock({ openReportModal }));
      const item: BorrowedItem = { id: 1, name: "Multimeter", date: "1 Apr 26", img: "", status: "active" };
      mockUseInventory.mockReturnValue({ borrowedItems: [item] } as any);
      render(<BorrowedPage />);
      fireEvent.click(screen.getByRole("button", { name: /Report Damage/i }));
      expect(openReportModal).toHaveBeenCalledWith(item);
    });

    it("does not call openReportModal when button is disabled (damage_reported)", () => {
      const openReportModal = jest.fn();
      mockUseDamageReport.mockReturnValue(makeDamageReportMock({ openReportModal }));
      mockUseInventory.mockReturnValue({
        borrowedItems: [{ id: 2, name: "Oscilloscope", date: "2 Apr 26", img: "", status: "damage_reported" }],
      } as any);
      render(<BorrowedPage />);
      fireEvent.click(screen.getByRole("button", { name: /Report Damage/i }));
      expect(openReportModal).not.toHaveBeenCalled();
    });
  });

  describe("Search filter", () => {
    it("filters items based on search query", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.change(screen.getByPlaceholderText("Search borrowed items..."), {
        target: { value: "Multi" },
      });
      expect(screen.getByText("Multimeter")).toBeInTheDocument();
      expect(screen.queryByText("Oscilloscope")).not.toBeInTheDocument();
    });

    it("is case-insensitive", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.change(screen.getByPlaceholderText("Search borrowed items..."), {
        target: { value: "oscilloscope" },
      });
      expect(screen.getByText("Oscilloscope")).toBeInTheDocument();
      expect(screen.queryByText("Multimeter")).not.toBeInTheDocument();
    });

    it("shows empty search message when no items match", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.change(screen.getByPlaceholderText("Search borrowed items..."), {
        target: { value: "xyzzy-no-match" },
      });
      expect(screen.getByText("No borrowed items match your search")).toBeInTheDocument();
    });

    it("shows a search filter badge when query is active", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.change(screen.getByPlaceholderText("Search borrowed items..."), {
        target: { value: "Multi" },
      });
      expect(screen.getByText(/Search: "Multi"/)).toBeInTheDocument();
    });

    it("clears the search filter when the badge X is clicked", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.change(screen.getByPlaceholderText("Search borrowed items..."), {
        target: { value: "Multi" },
      });
      fireEvent.click(screen.getByText("✕"));
      expect(screen.queryByText(/Search:/)).not.toBeInTheDocument();
      expect(screen.getByText("Multimeter")).toBeInTheDocument();
    });
  });

  describe("Sort", () => {
    it("sorts items by name (A-Z)", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "name" },
      });
      const items = screen.getAllByRole("heading", { level: 4 });
      const names = items.map((el) => el.textContent);
      expect(names).toEqual([...names].sort());
    });
  });

  describe("Status filter", () => {
    it("shows the filter panel when Show button is clicked", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.click(screen.getByRole("button", { name: /Show/i }));
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    });

    it("filters by Active status", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: sampleBorrowedItems } as any);
      render(<BorrowedPage />);
      fireEvent.click(screen.getByRole("button", { name: /Show/i }));
      fireEvent.click(screen.getByRole("button", { name: "Active" }));
      expect(screen.getByText("Multimeter")).toBeInTheDocument();
      expect(screen.queryByText("Oscilloscope")).not.toBeInTheDocument();
      expect(screen.queryByText("Soldering Iron")).not.toBeInTheDocument();
    });
  });

  describe("ReportModal integration", () => {
    it("renders the ReportModal (closed by default)", () => {
      mockUseInventory.mockReturnValue({ borrowedItems: [] } as any);
      render(<BorrowedPage />);
      expect(screen.queryByTestId("report-modal")).not.toBeInTheDocument();
    });

    it("shows the ReportModal when isReportModalOpen is true", () => {
      mockUseDamageReport.mockReturnValue(
        makeDamageReportMock({ isReportModalOpen: true })
      );
      mockUseInventory.mockReturnValue({ borrowedItems: [] } as any);
      render(<BorrowedPage />);
      expect(screen.getByTestId("report-modal")).toBeInTheDocument();
    });
  });
});
