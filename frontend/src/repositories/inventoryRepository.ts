import { Item, BorrowedItem, User } from '../domain/models/Item';

// Mock Data - Milestone 1 Inventory
const MOCK_ITEMS: Item[] = [
    { id: 1, name: 'ESP32 Board Extender 2', qty: 5, total: 10, cabinet: 'A1-02', img: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=300' },
    { id: 2, name: 'Ultrasonic Sensor HC-SR04', qty: 1, total: 8, cabinet: 'B2-05', img: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=300' },
    { id: 3, name: 'Relay 1 Channel Module', qty: 0, total: 5, cabinet: 'C1-10', img: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=300' },
    { id: 4, name: 'Digital Multimeter', qty: 3, total: 3, cabinet: 'D4-01', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=300' },
    { id: 5, name: 'Arduino Nano V3', qty: 10, total: 10, cabinet: 'A1-05', img: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=300' },
];

// Mock Data - Milestone 3 Borrowed List
const MOCK_BORROWED_ITEMS: BorrowedItem[] = [
    { id: 101, name: 'ESP32 Board Extender 2', date: '27 ก.พ. 67', loc: 'ตู้ A1-02' },
];

const MOCK_CURRENT_USER: User = {
    id: 'user_1',
    name: 'นายสมชาย เรียนเก่ง',
    studentId: '64010XXX',
    initial: 'สม'
};

export const inventoryRepository = {
    getInventoryItems: async (): Promise<Item[]> => {
        // In a real app, this would be an API call
        return Promise.resolve(MOCK_ITEMS);
    },

    getBorrowedItems: async (): Promise<BorrowedItem[]> => {
        // In a real app, this would be an API call
        return Promise.resolve(MOCK_BORROWED_ITEMS);
    },

    getCurrentUser: async (): Promise<User> => {
        // In a real app, this would be an API call
        return Promise.resolve(MOCK_CURRENT_USER);
    }
};
