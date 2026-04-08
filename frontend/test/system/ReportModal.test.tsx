import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  Camera: () => <span data-testid="icon-camera" />,
}));

import { ReportModal } from "@/components/features/ReportModal";
import { BorrowedItem } from "@/domain/models/Item";

const mockItem: BorrowedItem = {
  id: 1,
  name: "Multimeter",
  date: "1 Apr 26",
  img: "",
  status: "active",
};

function renderModal(overrides: Partial<React.ComponentProps<typeof ReportModal>> = {}) {
  const defaultProps: React.ComponentProps<typeof ReportModal> = {
    isOpen: true,
    selectedItem: mockItem,
    reportImagePreview: null,
    onClose: jest.fn(),
    onImageChange: jest.fn(),
    onRemoveImage: jest.fn(),
    reportDetail: "",
    setReportDetail: jest.fn(),
    onSubmit: jest.fn(),
    isSubmitting: false,
    error: null,
    onClearError: jest.fn(),
  };
  return render(<ReportModal {...defaultProps} {...overrides} />);
}

describe("ReportModal", () => {
  describe("Visibility", () => {
    it("does not render when isOpen is false", () => {
      const { container } = renderModal({ isOpen: false });
      expect(container.firstChild).toBeNull();
    });

    it("renders when isOpen is true", () => {
      renderModal({ isOpen: true });
      expect(screen.getByText("Report Damage")).toBeInTheDocument();
    });
  });

  describe("Content", () => {
    it("displays the selected item name", () => {
      renderModal();
      expect(screen.getByText(/Multimeter/)).toBeInTheDocument();
    });

    it("renders the problem description textarea", () => {
      renderModal();
      expect(screen.getByPlaceholderText(/Broken pin/)).toBeInTheDocument();
    });

    it("renders the Cancel button", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("renders the Submit Report button", () => {
      renderModal();
      expect(screen.getByRole("button", { name: /Submit Report/i })).toBeInTheDocument();
    });

    it("shows note about filing report for active borrowing", () => {
      renderModal();
      expect(
        screen.getByText(/Report will be filed for your currently active borrowing/)
      ).toBeInTheDocument();
    });
  });

  describe("Error display", () => {
    it("shows the error message when error prop is provided", () => {
      renderModal({ error: "Something went wrong" });
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("shows hint when error mentions no active borrowing", () => {
      renderModal({ error: "User has no active borrowing" });
      expect(screen.getByText(/refreshing the page/i)).toBeInTheDocument();
    });

    it("does not show error section when error is null", () => {
      renderModal({ error: null });
      expect(screen.queryByText("Error submitting report")).not.toBeInTheDocument();
    });
  });

  describe("Submit button state", () => {
    it("is disabled when description is empty and no image", () => {
      renderModal({ reportDetail: "", reportImagePreview: null });
      const submitBtn = screen.getByRole("button", { name: /Submit Report/i });
      expect(submitBtn).toBeDisabled();
    });

    it("is disabled when description is provided but no image", () => {
      renderModal({ reportDetail: "Broken pin", reportImagePreview: null });
      const submitBtn = screen.getByRole("button", { name: /Submit Report/i });
      expect(submitBtn).toBeDisabled();
    });

    it("is disabled when image is provided but description is empty", () => {
      renderModal({ reportDetail: "", reportImagePreview: "blob:mock-url" });
      const submitBtn = screen.getByRole("button", { name: /Submit Report/i });
      expect(submitBtn).toBeDisabled();
    });

    it("is disabled when description is only whitespace", () => {
      renderModal({ reportDetail: "   ", reportImagePreview: "blob:mock-url" });
      const submitBtn = screen.getByRole("button", { name: /Submit Report/i });
      expect(submitBtn).toBeDisabled();
    });

    it("is enabled when both description and image are provided", () => {
      renderModal({ reportDetail: "Broken pin", reportImagePreview: "blob:mock-url" });
      const submitBtn = screen.getByRole("button", { name: /Submit Report/i });
      expect(submitBtn).not.toBeDisabled();
    });

    it("is disabled while submitting even with valid form", () => {
      renderModal({
        reportDetail: "Broken pin",
        reportImagePreview: "blob:mock-url",
        isSubmitting: true,
      });
      const submitBtn = screen.getByRole("button", { name: /Submitting.../i });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe("Interactions", () => {
    it("calls onClose and onClearError when Cancel is clicked", () => {
      const onClose = jest.fn();
      const onClearError = jest.fn();
      renderModal({ onClose, onClearError });
      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
      expect(onClearError).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose and onClearError when the X button is clicked", () => {
      const onClose = jest.fn();
      const onClearError = jest.fn();
      renderModal({ onClose, onClearError });
      // The X button is the close button at the top right of the modal header
      const closeButtons = screen.getAllByRole("button");
      // First disabled-looking button in header is the X close button
      const xButton = closeButtons.find((btn) =>
        btn.querySelector('[data-testid="icon-x"]')
      );
      expect(xButton).toBeDefined();
      fireEvent.click(xButton!);
      expect(onClearError).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onSubmit when Submit Report button is clicked with valid form", () => {
      const onSubmit = jest.fn();
      renderModal({
        reportDetail: "Broken pin",
        reportImagePreview: "blob:mock-url",
        onSubmit,
      });
      fireEvent.click(screen.getByRole("button", { name: /Submit Report/i }));
      expect(onSubmit).toHaveBeenCalled();
    });

    it("calls setReportDetail when textarea value changes", () => {
      const setReportDetail = jest.fn();
      renderModal({ setReportDetail });
      fireEvent.change(screen.getByPlaceholderText(/Broken pin/), {
        target: { value: "Screen cracked" },
      });
      expect(setReportDetail).toHaveBeenCalledWith("Screen cracked");
    });

    it("Cancel button is disabled while submitting", () => {
      renderModal({ isSubmitting: true, reportDetail: "", reportImagePreview: null });
      const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
      expect(cancelBtn).toBeDisabled();
    });
  });

  describe("Image preview", () => {
    it("shows file upload area when no image is selected", () => {
      renderModal({ reportImagePreview: null });
      expect(
        screen.getByText(/Tap to take photo or select from library/)
      ).toBeInTheDocument();
    });

    it("shows image preview when reportImagePreview is set", () => {
      renderModal({ reportImagePreview: "blob:mock-preview-url" });
      const previewImg = screen.getByAltText("Evidence Preview");
      expect(previewImg).toBeInTheDocument();
    });

    it("shows remove image button when preview is active", () => {
      renderModal({ reportImagePreview: "blob:mock-preview-url" });
      // The remove button is inside the preview area; find the X icon inside preview
      const previewImg = screen.getByAltText("Evidence Preview");
      const previewContainer = previewImg.closest("div");
      const removeBtn = previewContainer
        ?.closest("div")
        ?.querySelector("button");
      expect(removeBtn).toBeInTheDocument();
    });

    it("calls onRemoveImage when remove button is clicked", () => {
      const onRemoveImage = jest.fn();
      renderModal({
        reportImagePreview: "blob:mock-preview-url",
        onRemoveImage,
      });
      const previewImg = screen.getByAltText("Evidence Preview");
      // Walk up to find the parent that contains the remove button
      const removeBtn = previewImg
        .closest(".relative")
        ?.querySelector("button");
      expect(removeBtn).toBeDefined();
      fireEvent.click(removeBtn!);
      expect(onRemoveImage).toHaveBeenCalled();
    });
  });
});
