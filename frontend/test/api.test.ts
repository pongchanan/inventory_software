import {
  createItem,
  deleteItem,
  fetchItemByUid,
  fetchItems,
  getImageUrl,
  updateItem,
} from '@/lib/api'

global.fetch = jest.fn()

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('fetchItems', () => {
    it('fetches item types and maps to item contract', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: 'Item 1',
            active: true,
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
            images: [],
          },
          {
            id: 2,
            name: 'Item 2',
            active: false,
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
            images: [],
          },
        ],
      })

      const result = await fetchItems()

      expect(global.fetch).toHaveBeenCalledWith('/api/item-types', { cache: 'no-store' })
      expect(result).toHaveLength(2)
      expect(result[0].uid).toBe('TYPE-1')
      expect(result[1].uid).toBe('TYPE-2')
    })

    it('filters by available status after mapping', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: 'Item 1',
            active: true,
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
            images: [],
          },
          {
            id: 2,
            name: 'Item 2',
            active: false,
            created_at: '2026-03-01T00:00:00.000Z',
            updated_at: '2026-03-01T00:00:00.000Z',
            images: [],
          },
        ],
      })

      const result = await fetchItems(true)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it('throws error on failed fetch', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
      await expect(fetchItems()).rejects.toThrow('Failed to fetch item types')
    })
  })

  describe('fetchItemByUid', () => {
    it('fetches item by TYPE uid', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'Test Item',
          active: true,
          created_at: '2026-03-01T00:00:00.000Z',
          updated_at: '2026-03-01T00:00:00.000Z',
          images: [],
        }),
      })

      const result = await fetchItemByUid('TYPE-1')
      expect(global.fetch).toHaveBeenCalledWith('/api/item-types/1', { cache: 'no-store' })
      expect(result.uid).toBe('TYPE-1')
    })

    it('throws error when item not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
      await expect(fetchItemByUid('TYPE-999')).rejects.toThrow('Item not found')
    })
  })

  describe('createItem', () => {
    it('creates a new item type', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'New Item',
          active: true,
          created_at: '2026-03-01T00:00:00.000Z',
          updated_at: '2026-03-01T00:00:00.000Z',
        }),
      })

      const result = await createItem({ uid: 'NEWITEM', name: 'New Item' })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/item-types',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Item' }),
        })
      )
      expect(result.uid).toBe('TYPE-1')
    })
  })

  describe('updateItem and deleteItem', () => {
    it('updates an existing item type', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'Updated Name',
          active: true,
          created_at: '2026-03-01T00:00:00.000Z',
          updated_at: '2026-03-01T00:00:00.000Z',
        }),
      })

      await updateItem('TYPE-1', { name: 'Updated Name', uid: 'TYPE-1' })
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/item-types/1',
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    it('deletes an item type', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
      await deleteItem('TYPE-1')
      expect(global.fetch).toHaveBeenCalledWith('/api/item-types/1', { method: 'DELETE' })
    })
  })

  describe('getImageUrl', () => {
    it('returns placeholder for null image URL', () => {
      expect(getImageUrl(null)).toBe('/placeholder.png')
    })

    it('returns placeholder for empty string', () => {
      expect(getImageUrl('')).toBe('/placeholder.png')
    })

    it('returns the image URL for relative path', () => {
      expect(getImageUrl('/uploads/items/test.jpg')).toContain('/uploads/items/test.jpg')
    })

    it('returns absolute URLs as-is', () => {
      const imageUrl = 'http://example.com/image.jpg'
      expect(getImageUrl(imageUrl)).toBe(imageUrl)
    })
  })
})
