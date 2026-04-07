import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api_client/damaged_reports");

import { useDamageReport } from "@/services/hooks/useDamageReport";
import { submitDamageReport } from "@/lib/api_client/damaged_reports";
import { BorrowedItem } from "@/domain/models/Item";

const mockSubmitDamageReport = submitDamageReport as jest.MockedFunction<
  typeof submitDamageReport
>;

// jsdom doesn't implement these URL APIs
global.URL.createObjectURL = jest.fn(() => "blob:mock-object-url");
global.URL.revokeObjectURL = jest.fn();

// Suppress alert in tests
global.alert = jest.fn();

const mockItem: BorrowedItem = {
  id: 1,
  name: "Multimeter",
  date: "1 Apr 26",
  img: "",
  status: "active",
};

describe("useDamageReport", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected error logs from error-path tests (the hook logs the caught error).
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('Damage report submission error:')) return;
      process.stderr.write(args.join(' ') + '\n');
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Initial state", () => {
    it("starts with modal closed", () => {
      const { result } = renderHook(() => useDamageReport());
      expect(result.current.isReportModalOpen).toBe(false);
    });

    it("starts with no selected item", () => {
      const { result } = renderHook(() => useDamageReport());
      expect(result.current.selectedItem).toBeNull();
    });

    it("starts with empty report detail", () => {
      const { result } = renderHook(() => useDamageReport());
      expect(result.current.reportDetail).toBe("");
    });

    it("starts with no image preview", () => {
      const { result } = renderHook(() => useDamageReport());
      expect(result.current.reportImagePreview).toBeNull();
    });

    it("starts not submitting", () => {
      const { result } = renderHook(() => useDamageReport());
      expect(result.current.isSubmitting).toBe(false);
    });

    it("starts with no error", () => {
      const { result } = renderHook(() => useDamageReport());
      expect(result.current.error).toBeNull();
    });
  });

  describe("openReportModal", () => {
    it("sets isReportModalOpen to true", () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        result.current.openReportModal(mockItem);
      });
      expect(result.current.isReportModalOpen).toBe(true);
    });

    it("sets the selected item", () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        result.current.openReportModal(mockItem);
      });
      expect(result.current.selectedItem).toEqual(mockItem);
    });

    it("clears any previous error when opening", () => {
      const { result } = renderHook(() => useDamageReport());
      // First set an error manually via setReportDetail workaround — simulate via submitReport
      act(() => {
        result.current.openReportModal(mockItem);
      });
      // Trigger an error by submitting with empty fields
      act(() => {
        result.current.submitReport();
      });
      // Reopen the modal — error should be cleared
      act(() => {
        result.current.openReportModal(mockItem);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe("closeReportModal", () => {
    it("sets isReportModalOpen to false", () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        result.current.openReportModal(mockItem);
      });
      act(() => {
        result.current.closeReportModal();
      });
      expect(result.current.isReportModalOpen).toBe(false);
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      const { result } = renderHook(() => useDamageReport());
      // Trigger validation error
      act(() => {
        result.current.submitReport();
      });
      expect(result.current.error).not.toBeNull();
      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe("setReportDetail", () => {
    it("updates the reportDetail state", () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        result.current.setReportDetail("Broken screen");
      });
      expect(result.current.reportDetail).toBe("Broken screen");
    });
  });

  describe("handleRemoveImage", () => {
    it("clears the image preview", () => {
      const { result } = renderHook(() => useDamageReport());
      // Simulate image being set via direct state
      act(() => {
        const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });
      expect(result.current.reportImagePreview).toBe("blob:mock-object-url");

      act(() => {
        result.current.handleRemoveImage();
      });
      expect(result.current.reportImagePreview).toBeNull();
    });

    it("calls URL.revokeObjectURL when removing image", () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });
      act(() => {
        result.current.handleRemoveImage();
      });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-object-url");
    });
  });

  describe("handleImageChange", () => {
    it("sets image preview when a file is selected", () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        const file = new File(["img"], "damage.jpg", { type: "image/jpeg" });
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });
      expect(result.current.reportImagePreview).toBe("blob:mock-object-url");
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it("does nothing when file list is empty", () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        const event = {
          target: { files: [] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });
      expect(result.current.reportImagePreview).toBeNull();
    });
  });

  describe("submitReport", () => {
    it("sets validation error when reportDetail is empty and no image", async () => {
      const { result } = renderHook(() => useDamageReport());
      await act(async () => {
        await result.current.submitReport();
      });
      expect(result.current.error).toBe(
        "Please fill in all required fields (description and photo)"
      );
    });

    it("sets validation error when only description is provided", async () => {
      const { result } = renderHook(() => useDamageReport());
      act(() => {
        result.current.setReportDetail("Broken screen");
      });
      await act(async () => {
        await result.current.submitReport();
      });
      expect(result.current.error).toBe(
        "Please fill in all required fields (description and photo)"
      );
    });

    it("calls submitDamageReport API with correct arguments on success", async () => {
      mockSubmitDamageReport.mockResolvedValueOnce({} as any);
      const { result } = renderHook(() => useDamageReport());

      // Set up image and description
      act(() => {
        result.current.setReportDetail("Broken pin");
      });
      const file = new File(["img"], "damage.jpg", { type: "image/jpeg" });
      act(() => {
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });

      await act(async () => {
        await result.current.submitReport();
      });

      expect(mockSubmitDamageReport).toHaveBeenCalledWith(
        "Damage Report",
        "Broken pin",
        file
      );
    });

    it("closes modal and alerts on successful submission", async () => {
      mockSubmitDamageReport.mockResolvedValueOnce({} as any);
      const { result } = renderHook(() => useDamageReport());

      act(() => {
        result.current.openReportModal(mockItem);
        result.current.setReportDetail("Broken pin");
      });
      const file = new File(["img"], "damage.jpg", { type: "image/jpeg" });
      act(() => {
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });

      await act(async () => {
        await result.current.submitReport();
      });

      expect(global.alert).toHaveBeenCalledWith("Damage report submitted successfully!");
      expect(result.current.isReportModalOpen).toBe(false);
    });

    it("sets error message on API failure", async () => {
      mockSubmitDamageReport.mockRejectedValueOnce(
        new Error("User has no active borrowing")
      );
      const { result } = renderHook(() => useDamageReport());

      act(() => {
        result.current.setReportDetail("Broken pin");
      });
      const file = new File(["img"], "damage.jpg", { type: "image/jpeg" });
      act(() => {
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });

      await act(async () => {
        await result.current.submitReport();
      });

      expect(result.current.error).toBe("User has no active borrowing");
      expect(result.current.isSubmitting).toBe(false);
    });

    it("resets isSubmitting to false after completion", async () => {
      mockSubmitDamageReport.mockResolvedValueOnce({} as any);
      const { result } = renderHook(() => useDamageReport());

      act(() => {
        result.current.setReportDetail("Broken pin");
      });
      const file = new File(["img"], "damage.jpg", { type: "image/jpeg" });
      act(() => {
        const event = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        result.current.handleImageChange(event);
      });

      await act(async () => {
        await result.current.submitReport();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
