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
    jest.resetAllMocks()
  })

  describe('fetchItems', () => {
    it('fetches item types and maps to item contract', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 1,
              name: 'Item 1',
              is_active: true,
              quantity: 5,
              image: null,
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-01T00:00:00.000Z',
            },
            {
              id: 2,
              name: 'Item 2',
              is_active: false,
              quantity: 0,
              image: null,
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-01T00:00:00.000Z',
            },
          ],
          total: 2,
          page: 1,
        }),
      })

      const result = await fetchItems()

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/items/', { cache: 'no-store' })
      expect(result).toHaveLength(2)
      expect(result[0].uid).toBe('TYPE-1')
      expect(result[1].uid).toBe('TYPE-2')
    })

    it('filters by available status after mapping', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 1,
              name: 'Item 1',
              is_active: true,
              quantity: 5,
              image: null,
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-01T00:00:00.000Z',
            },
            {
              id: 2,
              name: 'Item 2',
              is_active: false,
              quantity: 0,
              image: null,
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-01T00:00:00.000Z',
            },
          ],
          total: 2,
          page: 1,
        }),
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
          items: [
            {
              id: 1,
              name: 'Test Item',
              is_active: true,
              quantity: 3,
              image: null,
              created_at: '2026-03-01T00:00:00.000Z',
              updated_at: '2026-03-01T00:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
        }),
      })

      const result = await fetchItemByUid('TYPE-1')
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/items/', { cache: 'no-store' })
      expect(result.uid).toBe('TYPE-1')
    })

    it('throws error when item not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
      await expect(fetchItemByUid('TYPE-999')).rejects.toThrow('Item not found')
    })
  })

  describe('createItem', () => {
    it('throws not-yet-implemented error', async () => {
      await expect(createItem({ uid: 'NEWITEM', name: 'New Item' })).rejects.toThrow(
        'not yet implemented in backend'
      )
    })
  })

  describe('updateItem and deleteItem', () => {
    it('throws not-yet-implemented error for updateItem', async () => {
      await expect(updateItem('TYPE-1', { name: 'Updated Name', uid: 'TYPE-1' })).rejects.toThrow(
        'not yet implemented in backend'
      )
    })

    it('throws not-yet-implemented error for deleteItem', async () => {
      await expect(deleteItem('TYPE-1')).rejects.toThrow('not yet implemented in backend')
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
