import { render, screen } from '@testing-library/react'
import ItemCard from '@/components/ItemCard'
import { Item } from '@/lib/api'

const mockItem: Item = {
  id: 1,
  uid: 'TEST001',
  name: 'Test Item',
  description: 'This is a test item',
  category: 'Electronics',
  quantity: 5,
  available: true,
  location: 'Shelf A1',
  image_url: '/test-image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('ItemCard', () => {
  it('renders item name', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText('Test Item')).toBeInTheDocument()
  })

  it('renders item description', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText('This is a test item')).toBeInTheDocument()
  })

  it('renders item category', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('renders item location', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText(/Shelf A1/)).toBeInTheDocument()
  })

  it('renders item quantity', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText(/Qty: 5/)).toBeInTheDocument()
  })

  it('shows available status when item is available', () => {
    render(<ItemCard item={mockItem} />)
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('shows unavailable status when item is not available', () => {
    const unavailableItem = { ...mockItem, available: false }
    render(<ItemCard item={unavailableItem} />)
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('renders item image', () => {
    render(<ItemCard item={mockItem} />)
    const image = screen.getByAltText('Test Item')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src')
  })

  it('does not render description when not provided', () => {
    const itemWithoutDescription = { ...mockItem, description: null }
    render(<ItemCard item={itemWithoutDescription} />)
    expect(screen.queryByText('This is a test item')).not.toBeInTheDocument()
  })

  it('does not render category when not provided', () => {
    const itemWithoutCategory = { ...mockItem, category: null }
    render(<ItemCard item={itemWithoutCategory} />)
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument()
  })

  it('does not render location when not provided', () => {
    const itemWithoutLocation = { ...mockItem, location: null }
    render(<ItemCard item={itemWithoutLocation} />)
    expect(screen.queryByText(/📍/)).not.toBeInTheDocument()
  })

  it('has hover shadow effect class', () => {
    const { container } = render(<ItemCard item={mockItem} />)
    const card = container.firstChild
    expect(card).toHaveClass('hover:shadow-md')
  })
})
