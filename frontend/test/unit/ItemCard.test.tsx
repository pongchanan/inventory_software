import { render, screen } from "@testing-library/react";
import { ItemCard } from "@/components/inventory/ItemCard";
import { Item } from "@/domain/models/Item";

const mockItem: Item = {
  id: 1,
  name: "Test Item",
  qty: 5,
  total: 10,
  cabinet: "A1",
  img: "/test-image.jpg",
};

describe("ItemCard", () => {
  it("renders item name", () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });

  it("renders cabinet label", () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText("A1")).toBeInTheDocument();
  });

  it("shows remaining quantity when item is in stock", () => {
    render(<ItemCard item={mockItem} />);
    expect(screen.getByText(/5 Available/)).toBeInTheDocument();
  });

  it("shows out of stock message when qty is 0", () => {
    const outOfStockItem = { ...mockItem, qty: 0 };
    render(<ItemCard item={outOfStockItem} />);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("renders item image with correct alt text", () => {
    render(<ItemCard item={mockItem} />);
    const image = screen.getByAltText("Test Item");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src");
  });

  it("has shadow class", () => {
    const { container } = render(<ItemCard item={mockItem} />);
    const card = container.firstChild;
    expect(card).toHaveClass("shadow-sm");
  });
});
