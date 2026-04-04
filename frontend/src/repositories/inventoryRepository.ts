import { Item, BorrowedItem, User } from '../domain/models/Item';

import { fetchItems, fetchActiveLoanDetails, fetchMe, getImageUrl } from '../lib/api';

export const inventoryRepository = {
    getInventoryItems: async (): Promise<Item[]> => {
        try {
            const apiItems = await fetchItems();
            return apiItems.map(item => ({
                id: item.id,
                name: item.name,
                qty: item.quantity,
                total: item.quantity,
                cabinet: item.location || 'ไม่ระบุ',
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

            const loans = await fetchActiveLoanDetails();
            // Only show items that haven't been returned yet (returned_at is null)
            return loans
                .filter(loan => loan.returned_at === null)
                .map(loan => {
                    const dateObj = new Date(loan.borrowed_at);
                    const formatter = new Intl.DateTimeFormat('th-TH', {
                        day: 'numeric', month: 'short', year: '2-digit'
                    });
                    return {
                        id: loan.id,
                        name: loan.item_name,
                        date: formatter.format(dateObj),
                        loc: loan.item_category || 'Not Specified',
                        img: getImageUrl(loan.item_image_url)
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
