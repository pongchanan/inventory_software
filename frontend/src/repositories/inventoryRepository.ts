import { Item, BorrowedItem, User } from '../domain/models/Item';

import { fetchItems, fetchMe, getImageUrl } from '../lib/api';

export const inventoryRepository = {
    getInventoryItems: async (): Promise<Item[]> => {
        try {
            const apiItems = await fetchItems();
            return apiItems.map(item => ({
                id: item.id,
                name: item.name,
                qty: item.quantity,
                total: item.quantity,
                cabinet: item.location || 'Unspecified',
                img: getImageUrl(item.image_url)
            }));
        } catch (error) {
            console.warn('Failed to fetch items:', error);
            return [];
        }
    },

    getBorrowedItems: async (): Promise<BorrowedItem[]> => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return [];

            // Use fetchMyBorrowings instead of fetchActiveLoanDetails (which uses admin endpoint)
            const { fetchMyBorrowings } = await import('../lib/api_client/borrowings');
            const borrowings = await fetchMyBorrowings(1, 100);
            
            return borrowings.map(loan => {
                const dateObj = new Date(loan.borrow_at);
                const formatter = new Intl.DateTimeFormat('en-US', {
                    day: 'numeric', month: 'short', year: '2-digit'
                });
                return {
                    id: loan.id,
                    name: loan.item?.name || `Item ${loan.item_id}`,
                    date: formatter.format(dateObj),
                    loc: 'Not Specified',
                    img: '',
                    status: (loan.status || 'active') as 'active' | 'overdue' | 'returning'
                };
            });
        } catch (error) {
            console.warn('Failed to fetch borrowed items:', error);
            return [];
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            const authUser = await fetchMe(token);
            return {
                id: authUser.uid,
                name: authUser.name,
                studentId: authUser.email ? authUser.email.split('@')[0] : '',
                initial: authUser.name.substring(0, 2)
            };
        } catch (error) {
            console.warn('Failed to fetch current user:', error);
            return null;
        }
    }
};
