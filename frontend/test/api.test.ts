import { fetchItems, fetchItemByUid, createItem, updateItem, deleteItem, getImageUrl } from '@/lib/api'

// Mock fetch globally
global.fetch = jest.fn()

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('fetchItems', () => {
    it('fetches all items without filter', async () => {
      const mockItems = [
        { id: 1, uid: 'ITEM001', name: 'Item 1', available: true },
        { id: 2, uid: 'ITEM002', name: 'Item 2', available: false },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockItems,
      })

      const result = await fetchItems()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/'),
        expect.objectContaining({ cache: 'no-store' })
      )
      expect(result).toEqual(mockItems)
    })

    it('fetches items with available filter', async () => {
      const mockItems = [
        { id: 1, uid: 'ITEM001', name: 'Item 1', available: true },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockItems,
      })

      const result = await fetchItems(true)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('available=true'),
        expect.objectContaining({ cache: 'no-store' })
      )
      expect(result).toEqual(mockItems)
    })

    it('throws error on failed fetch', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      await expect(fetchItems()).rejects.toThrow('Failed to fetch items')
    })
  })

  describe('fetchItemByUid', () => {
    it('fetches item by UID', async () => {
      const mockItem = { id: 1, uid: 'ITEM001', name: 'Test Item' }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      })

      const result = await fetchItemByUid('ITEM001')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/ITEM001'),
        expect.any(Object)
      )
      expect(result).toEqual(mockItem)
    })

    it('throws error when item not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      await expect(fetchItemByUid('NONEXISTENT')).rejects.toThrow()
    })
  })

  describe('createItem', () => {
    it('creates a new item', async () => {
      const newItem = {
        uid: 'NEWITEM',
        name: 'New Item',
        description: 'A new item',
        quantity: 5,
      }

      const mockResponse = { id: 1, ...newItem }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await createItem(newItem)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newItem),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on failed creation', async () => {
      const newItem = {
        uid: 'NEWITEM',
        name: 'New Item',
        quantity: 5,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Failed to create item' }),
      })

      await expect(createItem(newItem)).rejects.toThrow()
    })
  })

  describe('updateItem', () => {
    it('updates an existing item', async () => {
      const updates = { uid: 'ITEM001', name: 'Updated Name', quantity: 10 }
      const mockResponse = { id: 1, ...updates }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await updateItem('ITEM001', updates)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/ITEM001'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updates),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteItem', () => {
    it('deletes an item', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      await deleteItem('ITEM001')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/items/ITEM001'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('getImageUrl', () => {
    it('returns placeholder for null image URL', () => {
      const result = getImageUrl(null)
      expect(result).toBe('/placeholder.png')
    })

    it('returns placeholder for empty string', () => {
      const result = getImageUrl('')
      expect(result).toBe('/placeholder.png')
    })

    it('returns the image URL with API base when provided', () => {
      const imageUrl = '/uploads/items/test.jpg'
      const result = getImageUrl(imageUrl)
      expect(result).toContain('/uploads/items/test.jpg')
    })

    it('returns the image URL as-is for absolute URLs', () => {
      const imageUrl = 'http://example.com/image.jpg'
      const result = getImageUrl(imageUrl)
      expect(result).toBe(imageUrl)
    })
  })
})
