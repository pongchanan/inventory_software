import { useState, useMemo, useEffect } from 'react';
import { Item, BorrowedItem, User } from '../../domain/models/Item';
import { inventoryRepository } from '../../repositories/inventoryRepository';

export type SortOption = 'name' | 'qty-desc' | 'qty-asc';

export function useInventory() {
    const [items, setItems] = useState<Item[]>([]);
    const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [fetchedItems, fetchedBorrowed, fetchedUser] = await Promise.all([
                    inventoryRepository.getInventoryItems(),
                    inventoryRepository.getBorrowedItems(),
                    inventoryRepository.getCurrentUser()
                ]);

                setItems(fetchedItems);
                setBorrowedItems(fetchedBorrowed);
                setCurrentUser(fetchedUser);
            } catch (error) {
                console.error("Error fetching inventory data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Sorting and Filtering Logic
    const sortedItems = useMemo(() => {
        let result = [...items].filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
        if (sortBy === 'qty-desc') result.sort((a, b) => b.qty - a.qty);
        if (sortBy === 'qty-asc') result.sort((a, b) => a.qty - b.qty);

        return result;
    }, [items, sortBy, searchQuery]);

    return {
        items,
        borrowedItems,
        currentUser,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        sortedItems,
        isLoading
    };
}
