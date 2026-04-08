import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/ui/pagination";

describe("Pagination", () => {
  it("renders nothing when totalPages is 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page buttons for small page counts", () => {
    render(
      <Pagination page={1} totalPages={5} onPageChange={jest.fn()} />,
    );
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it("highlights the current page", () => {
    render(
      <Pagination page={3} totalPages={5} onPageChange={jest.fn()} />,
    );
    const btn = screen.getByText("3");
    expect(btn.className).toContain("bg-blue-600");
  });

  it("calls onPageChange when a page button is clicked", () => {
    const onChange = jest.fn();
    render(
      <Pagination page={1} totalPages={5} onPageChange={onChange} />,
    );
    fireEvent.click(screen.getByText("3"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("disables the previous button on the first page", () => {
    render(
      <Pagination page={1} totalPages={5} onPageChange={jest.fn()} />,
    );
    const buttons = screen.getAllByRole("button");
    const prevBtn = buttons[0];
    expect(prevBtn).toBeDisabled();
  });

  it("disables the next button on the last page", () => {
    render(
      <Pagination page={5} totalPages={5} onPageChange={jest.fn()} />,
    );
    const buttons = screen.getAllByRole("button");
    const nextBtn = buttons[buttons.length - 1];
    expect(nextBtn).toBeDisabled();
  });

  it("calls onPageChange with page-1 when previous is clicked", () => {
    const onChange = jest.fn();
    render(
      <Pagination page={3} totalPages={5} onPageChange={onChange} />,
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with page+1 when next is clicked", () => {
    const onChange = jest.fn();
    render(
      <Pagination page={3} totalPages={5} onPageChange={onChange} />,
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("renders ellipsis for large page counts", () => {
    render(
      <Pagination page={5} totalPages={20} onPageChange={jest.fn()} />,
    );
    const ellipses = screen.getAllByText("…");
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it("always shows first and last page for large totals", () => {
    render(
      <Pagination page={10} totalPages={20} onPageChange={jest.fn()} />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });
});
